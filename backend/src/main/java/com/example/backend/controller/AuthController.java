package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.LoginRequest;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.RegisterRequest;
import com.example.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse authResponse = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("User registered successfully.")
                .data(authResponse)
                .build()
        );
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = userService.loginUser(request);
        return ResponseEntity.ok(
            ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Login successful.")
                .data(authResponse)
                .build()
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody com.example.backend.dto.ResetPasswordRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .success(true)
                .message("Password reset successfully. You can now log in with your new password.")
                .build()
        );
    }
}