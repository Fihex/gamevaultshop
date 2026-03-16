package com.gamevault.controller;

import com.gamevault.entity.Role;
import com.gamevault.entity.User;
import com.gamevault.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<User> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        // Sort by ID Descending to show newest registered users first
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        
        if (search != null && !search.isEmpty()) {
            return userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(search, search, pageRequest);
        }
        return userRepository.findAll(pageRequest);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        try {
            return userRepository.findById(id).map(user -> {
                if (updates.containsKey("role")) {
                    user.setRole(Role.valueOf((String) updates.get("role")));
                }
                if (updates.containsKey("enabled")) {
                    user.setEnabled((Boolean) updates.get("enabled"));
                }
                return ResponseEntity.ok(userRepository.save(user));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating user status " + id, e);
            return ResponseEntity.internalServerError().body("Error updating user");
        }
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            // In a real app, verify the authenticated user matches the ID here
            return userRepository.findById(id).map(user -> {
                String newUsername = body.get("username");
                String newEmail = body.get("email");

                if (!user.getUsername().equals(newUsername) && userRepository.existsByUsername(newUsername)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already taken");
                }
                
                user.setUsername(newUsername);
                user.setEmail(newEmail);
                user.setPhone(body.get("phone"));
                
                if (body.containsKey("newPassword") && body.get("newPassword") != null && !body.get("newPassword").isEmpty()) {
                    user.setPassword(passwordEncoder.encode(body.get("newPassword")));
                }

                return ResponseEntity.ok(userRepository.save(user));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating user profile " + id, e);
            return ResponseEntity.internalServerError().body("Error updating profile");
        }
    }
}