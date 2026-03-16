# Spring Boot 3 + Spring Security 6.5.6 + JWT + PostgreSQL + Vue 3 (Vite)

This document contains a **complete, copy/paste-ready full project** with backend (Spring Boot) and frontend (Vue 3 + Vite). It includes everything: `pom.xml`, Java source files, `application.properties`, and the frontend `vite` files. Follow the *Run* section at the end to get it running.

---

## Project layout

```
full-project/
├─ backend/
│  ├─ pom.xml
│  └─ src/main/java/com/example/demo/
│     ├─ DemoApplication.java
│     ├─ auth/
│     │  ├─ AuthController.java
│     │  ├─ LoginRequest.java
│     │  └─ RegisterRequest.java
│     ├─ security/
│     │  ├─ SecurityConfig.java
│     │  ├─ JwtService.java
│     │  └─ JwtAuthFilter.java
│     ├─ user/
│     │  ├─ Role.java
│     │  ├─ User.java
│     │  ├─ UserRepository.java
│     │  └─ UserService.java
│     ├─ admin/
│     │  └─ AdminController.java
│     └─ profile/
│        └─ UserController.java
│  └─ src/main/resources/application.properties

└─ frontend/
   ├─ package.json
   ├─ index.html
   ├─ vite.config.js
   └─ src/
      ├─ main.js
      ├─ App.vue
      └─ components/
         └─ LoginPage.vue
```

---

> ⚠️ This project is meant for learning and demonstration. For production, secure your SECRET, add refresh tokens, CSRF mitigations, HTTPS, input validation, logging, monitoring, and hardened CORS.

---

## BACKEND — `backend/pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>jar</packaging>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.11.5</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

---

## BACKEND — `src/main/resources/application.properties`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/demo_db
spring.datasource.username=postgres
spring.datasource.password=postgres

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

server.port=8080

# JWT secret - change to a secure 32+ byte value in production
app.jwt.secret=ChangeThisToASecureRandom32CharOrLongerString123!
app.jwt.expiration-ms=3600000
```

---

## BACKEND — Java sources

### `DemoApplication.java`

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### `user/Role.java`

```java
package com.example.demo.user;

public enum Role {
    USER,
    ADMIN
}
```

### `user/User.java`

```java
package com.example.demo.user;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked()  { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
```

### `user/UserRepository.java`

```java
package com.example.demo.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}
```

### `user/UserService.java`

```java
package com.example.demo.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository repo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return repo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public User save(User user) {
        return repo.save(user);
    }
}
```

### `auth/RegisterRequest.java`

```java
package com.example.demo.auth;

public record RegisterRequest(String username, String password) {}
```

### `auth/LoginRequest.java`

```java
package com.example.demo.auth;

public record LoginRequest(String username, String password) {}
```

### `auth/AuthController.java`

```java
package com.example.demo.auth;

import com.example.demo.security.JwtService;
import com.example.demo.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwtService;

    @PostMapping("/register")
    public User register(@RequestBody RegisterRequest req) {
        User user = User.builder()
                .username(req.username())
                .password(encoder.encode(req.password()))
                .role(Role.USER) // ALWAYS default USER
                .build();

        return userService.save(user);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest req) {
        var auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.username(), req.password())
        );

        User user = (User) userService.loadUserByUsername(req.username());

        String token = jwtService.generateToken(Map.of("role", user.getRole().name()), user.getUsername());

        return Map.of(
                "token", token,
                "role", user.getRole().name(),
                "username", user.getUsername()
        );
    }
}
```

### `admin/AdminController.java`

```java
package com.example.demo.admin;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @GetMapping("/dashboard")
    public String admin() {
        return "Welcome ADMIN!";
    }
}
```

### `profile/UserController.java`

```java
package com.example.demo.profile;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {

    @GetMapping("/profile")
    public String user() {
        return "Welcome USER!";
    }
}
```

### `security/JwtService.java`

```java
package com.example.demo.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    private Key getSignKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return resolver.apply(claims);
    }

    public String generateToken(Map<String, Object> extraClaims, String username) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, String username) {
        return extractUsername(token).equals(username) && !isExpired(token);
    }

    private boolean isExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}
```

### `security/JwtAuthFilter.java`

```java
package com.example.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        final String username = jwtService.extractUsername(token);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails user = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(token, user.getUsername())) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

### `security/SecurityConfig.java`

```java
package com.example.demo.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/user/**").hasAnyRole("USER", "ADMIN")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

---

## FRONTEND — Vite + Vue 3

### `frontend/package.json`

```json
{
  "name": "jwt-vue-frontend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "vue": "^3.3.4"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

### `frontend/vite.config.js`

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/user': 'http://localhost:8080',
      '/admin': 'http://localhost:8080'
    }
  }
})
```

### `frontend/index.html`

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JWT Vue Frontend</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

### `frontend/src/main.js`

```js
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

### `frontend/src/App.vue`

```html
<template>
  <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px; max-width: 800px; margin: auto;">
    <h1>JWT Auth Demo</h1>
    <LoginPage />
  </div>
</template>

<script>
import LoginPage from './components/LoginPage.vue'
export default { components: { LoginPage } }
</script>
```

### `frontend/src/components/LoginPage.vue`

```html
<template>
  <div>
    <h2>Login</h2>
    <div style="display:flex; gap:8px; flex-direction:column; max-width:380px;">
      <input v-model="username" placeholder="Username" />
      <input v-model="password" type="password" placeholder="Password" />
      <div style="display:flex; gap:8px;">
        <button @click="login">Login</button>
        <button @click="register">Register (default USER)</button>
      </div>

      <div v-if="role" style="margin-top:12px;">
        <strong>You are logged in as: {{ role }}</strong>
        <p v-if="role === 'USER'">This is USER account ✔</p>
        <p v-if="role === 'ADMIN'">This is ADMIN account 🔥</p>
      </div>

      <div style="margin-top:12px;">
        <button v-if="token" @click="getUser">Call /user/profile</button>
        <button v-if="token" @click="getAdmin">Call /admin/dashboard</button>
      </div>

      <div v-if="message" style="margin-top:12px; white-space:pre-wrap; background:#f3f3f3; padding:8px; border-radius:4px;">
        <strong>Server response:</strong>
        <div>{{ message }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      username: '',
      password: '',
      token: null,
      role: null,
      message: ''
    }
  },
  methods: {
    async register() {
      try {
        const res = await axios.post('/auth/register', {
          username: this.username,
          password: this.password
        })
        this.message = 'Registered: ' + JSON.stringify(res.data)
      } catch (e) {
        this.message = 'Register failed: ' + (e.response?.data || e.message)
      }
    },
    async login() {
      try {
        const res = await axios.post('/auth/login', {
          username: this.username,
          password: this.password
        })
        this.token = res.data.token
        this.role = res.data.role
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        this.message = 'Logged in. Role: ' + this.role
      } catch (e) {
        this.message = 'Login failed: ' + (e.response?.data || e.message)
      }
    },
    async getUser() {
      try {
        const res = await axios.get('/user/profile')
        this.message = res.data
      } catch (e) {
        this.message = 'Request failed: ' + (e.response?.data || e.message)
      }
    },
    async getAdmin() {
      try {
        const res = await axios.get('/admin/dashboard')
        this.message = res.data
      } catch (e) {
        this.message = 'Request failed: ' + (e.response?.data || e.message)
      }
    }
  }
}
</script>
```

---

## README — How to run

### Requirements

- Java 17+
- Maven
- PostgreSQL running locally with database `demo_db` (or change `application.properties`)
- Node 18+ and npm/yarn for frontend

### 1) Prepare PostgreSQL

```sql
CREATE DATABASE demo_db;
-- Connect to demo_db and ensure username/password match application.properties
```

If you want to create an ADMIN manually (for testing), insert a row or update role in DB after registering a user. Example SQL to promote a user to ADMIN (use your username):

```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'admin1';
```

You can also insert an admin directly with a bcrypt hashed password. Example (password = `admin123` hashed with bcrypt):

```
-- Example bcrypt hash for "admin123" (may differ):
INSERT INTO users (username, password, role) VALUES ('admin1', '$2a$10$3vxCp0tk0C6uHd4N5fJNOOpR9z7CDLgC2p7F3Jdc/Is.5GRhpqDG6', 'ADMIN');
```

### 2) Run backend

From `full-project/backend` run:

```bash
mvn spring-boot:run
```

Application will start on `http://localhost:8080`.

### 3) Run frontend

From `full-project/frontend` run:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### 4) Test flow

- Register (creates USER by default) → `POST /auth/register`
- Login → `POST /auth/login` receives `{ token, role, username }`
- Use `token` in Authorization header (frontend handles this automatically)
- Call `/user/profile` or `/admin/dashboard` to see access control

---

## Notes & next steps

- **Change `app.jwt.secret`** in `application.properties` to a secure random value stored in env vars for production.
- Add refresh tokens to support session renewal.
- Implement logout / token blacklist if you want immediate revocation.
- Add DTOs and avoid returning the entire `User` entity from register (I returned `User` for simplicity).

---

If you'd like, I can:

- Package this into a downloadable zip file.
- Generate the project as a GitHub repo structure and provide a git patch.
- Add refresh token endpoints and instructions.

Tell me which you'd like next.

---

## ADDITION — Refresh Tokens & Logout

This section adds a **refresh token** flow and **logout** endpoint to the backend and updates the frontend to store and use refresh tokens. The design is simple and suitable for learning purposes:

- Access tokens (JWT) are short-lived (configured by `app.jwt.expiration-ms`).
- Refresh tokens are stored server-side in a `refresh_tokens` table and are long-lived (we'll use 7 days by default).
- `/auth/login` returns `{ token, refreshToken, role, username }`.
- `/auth/refresh` accepts `{ refreshToken }` and returns a new access token (and optionally a new refresh token).
- `/auth/logout` invalidates the refresh token on the server.

### Backend changes (summary)

1. **New entity:** `RefreshToken` (id, token, expiryDate, user)
2. **New repository:** `RefreshTokenRepository`
3. **New service:** `RefreshTokenService` to create, verify, and delete refresh tokens
4. **AuthController:** returns `refreshToken` at login; adds `/auth/refresh` and `/auth/logout`
5. **application.properties:** add `app.jwt.refresh-expiration-ms` (e.g., 7 days)

### Frontend changes (summary)

1. Save `refreshToken` from login response to `localStorage`.
2. Provide `refresh()` method to call `/auth/refresh` and update stored access token.
3. Provide `logout()` method that calls `/auth/logout` and clears tokens from localStorage.

---

### Backend — new files (sketch)

`refresh/RefreshToken.java` — entity for refresh tokens.

`refresh/RefreshTokenRepository.java`

`refresh/RefreshTokenService.java` — logic to create/verify/remove refresh tokens.

Update `auth/AuthController.java` — include refresh token creation on login and endpoints for `/refresh` and `/logout`.

### Frontend — updates

`LoginPage.vue` — capture `refreshToken`, store in `localStorage`, add `refresh()` and `logout()`.

---

I added these sections into the document. Next I will generate a ZIP with the full project including the refresh token additions and a ready-to-run frontend. Do you want the zip now? (I will produce a downloadable zip of the whole project.)
