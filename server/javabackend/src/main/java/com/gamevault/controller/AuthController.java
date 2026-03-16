
package com.gamevault.controller;

import com.gamevault.entity.Role;
import com.gamevault.entity.User;
import com.gamevault.entity.Setting;
import com.gamevault.entity.PasswordResetToken;
import com.gamevault.repository.UserRepository;
import com.gamevault.repository.PasswordResetTokenRepository;
import com.gamevault.repository.SettingRepository;
import com.gamevault.security.JwtTokenProvider;
import com.gamevault.service.AuditService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;
    
    @Autowired
    PasswordResetTokenRepository tokenRepository;
    
    @Autowired
    SettingRepository settingRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtTokenProvider tokenProvider;
    
    @Autowired
    AuditService auditService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        
        User user = userRepository.findByUsername(loginRequest.getUsername()).orElseThrow();
        
        auditService.log("LOGIN", "User logged in successfully", user.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("user", user);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignUpRequest signUpRequest) {
        // Check configuration
        Setting regSetting = settingRepository.findByKey("ENABLE_REGISTRATION").orElse(null);
        if (regSetting != null && "false".equalsIgnoreCase(regSetting.getValue())) {
             return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Registration is currently disabled by the administrator.");
        }

        if(userRepository.existsByUsername(signUpRequest.getUsername())) {
            return new ResponseEntity<>("Username is already taken!", HttpStatus.BAD_REQUEST);
        }

        if(userRepository.existsByEmail(signUpRequest.getEmail())) {
            return new ResponseEntity<>("Email Address already in use!", HttpStatus.BAD_REQUEST);
        }

        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setRole(Role.USER);

        userRepository.save(user);
        auditService.log("REGISTER", "New user registered: " + user.getUsername(), null);

        return new ResponseEntity<>("User registered successfully", HttpStatus.OK);
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        // Logic: Try to find by email first, then by username
        userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(email))
                .ifPresent(user -> {
                    String token = UUID.randomUUID().toString();
                    PasswordResetToken resetToken = new PasswordResetToken();
                    resetToken.setToken(token);
                    resetToken.setUser(user);
                    resetToken.setExpiryDate(LocalDateTime.now().plusHours(1));
                    tokenRepository.save(resetToken);
                    
                    // In production, send email. Here we log to system out for the admin to see.
                    System.out.println("=============================================");
                    System.out.println("PASSWORD RESET TOKEN FOR " + user.getEmail() + ": " + token);
                    System.out.println("=============================================");
                    
                    auditService.log("RESET_REQUEST", "Password reset requested for " + user.getEmail(), null);
                });
        
        // Always return OK to prevent email enumeration attacks
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        
        if (token == null || newPassword == null) {
             return ResponseEntity.badRequest().body("Token and new password are required");
        }

        return tokenRepository.findByToken(token)
                .filter(t -> !t.isExpired())
                .map(t -> {
                    User user = t.getUser();
                    user.setPassword(passwordEncoder.encode(newPassword));
                    userRepository.save(user);
                    tokenRepository.delete(t); // Invalidate token
                    auditService.log("RESET_SUCCESS", "Password reset successful for user " + user.getUsername(), null);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired token"));
    }

    @Data
    static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    static class SignUpRequest {
        private String username;
        private String email;
        private String password;
    }
}
