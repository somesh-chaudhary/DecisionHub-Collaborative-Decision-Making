package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.UserDto;
import com.example.backend.entity.User;
import com.example.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.ChangePasswordRequest;
import com.example.backend.dto.UpdateProfileRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal User user) {
        UserDto userDto = userService.convertToDto(user);
        return ResponseEntity.ok(
            ApiResponse.<UserDto>builder()
                .success(true)
                .message("User details fetched successfully.")
                .data(userDto)
                .build()
        );
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal User user) {

        UserDto updated = userService.updateProfile(user, request);
        return ResponseEntity.ok(
            ApiResponse.<UserDto>builder()
                .success(true)
                .message("Profile updated successfully.")
                .data(updated)
                .build()
        );
    }

    @PostMapping("/change-password")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User user) {

        userService.changePassword(user, request);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .success(true)
                .message("Password changed successfully.")
                .build()
        );
    }

    @PostMapping("/me/deactivate")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateAccount(
            @AuthenticationPrincipal User user) {

        userService.deactivateUser(user);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .success(true)
                .message("Account deactivated successfully.")
                .build()
        );
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMyAccount(
            @AuthenticationPrincipal User user) {

        userService.deleteUser(user.getId(), user);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                .success(true)
                .message("Account deleted successfully.")
                .build()
        );
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Long>> countUsers() {
        return ResponseEntity.ok(
            ApiResponse.<Long>builder()
                .success(true)
                .message("User count fetched successfully.")
                .data(userService.countUsers())
                .build()
        );
    }
}
