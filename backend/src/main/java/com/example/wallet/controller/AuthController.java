package com.example.wallet.controller;

import com.example.wallet.dto.LoginRequest;
import com.example.wallet.dto.SignupRequest;
import com.example.wallet.model.Role;
import com.example.wallet.model.User;
import com.example.wallet.service.JwtService;
import com.example.wallet.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req) {
        if (userService.emailExists(req.getEmail())) return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        if (userService.usernameExists(req.getUsername())) return ResponseEntity.badRequest().body(Map.of("error", "Username already in use"));
        User u = new User();
        u.setEmail(req.getEmail());
        u.setUsername(req.getUsername());
        u.setPassword(req.getPassword());
        u.setFirstName(req.getFirstName());
        u.setLastName(req.getLastName());
        u.setPhoneNumber(req.getPhoneNumber());
        u.getRoles().add(Role.USER);
        u = userService.registerLocal(u);
        String token = jwtService.generate(u.getUsername(), Map.of("uid", u.getId()));
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        User u = userService.findByUsernameOrEmail(req.getUsernameOrEmail());
        if (u == null) return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        // For demo only: proper password verification should be in a service with AuthenticationManager
        String token = jwtService.generate(u.getUsername(), Map.of("uid", u.getId()));
        return ResponseEntity.ok(Map.of("token", token));
    }
}
