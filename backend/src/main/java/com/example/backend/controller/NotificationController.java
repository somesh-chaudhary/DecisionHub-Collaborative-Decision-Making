package com.example.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.NotificationDto;
import com.example.backend.entity.User;
import com.example.backend.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getAllNotifications(
            @AuthenticationPrincipal User user) {

        List<NotificationDto> notifications =
                notificationService.getAllNotifications(user.getId());

        String message = notifications.isEmpty()
                ? "No notifications found."
                : "Notifications fetched successfully.";

        return ResponseEntity.ok(
                ApiResponse.<List<NotificationDto>>builder()
                        .success(true)
                        .message(message)
                        .data(notifications)
                        .build()
        );
    }

    @GetMapping("/unread")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUnreadNotifications(
            @AuthenticationPrincipal User user) {

        List<NotificationDto> notifications =
                notificationService.getUnreadNotifications(user.getId());

        return ResponseEntity.ok(
                ApiResponse.<List<NotificationDto>>builder()
                        .success(true)
                        .message("Unread notifications fetched successfully.")
                        .data(notifications)
                        .build()
        );
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal User user) {

        Long count = notificationService.getUnreadCount(user.getId());

        return ResponseEntity.ok(
                ApiResponse.<Long>builder()
                        .success(true)
                        .message("Unread notification count fetched successfully.")
                        .data(count)
                        .build()
        );
    }

    @PatchMapping("/{notificationId}/read")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<?>> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal User user) {

        notificationService.markAsRead(notificationId, user);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Notification marked as read.")
        );
    }

    @PatchMapping("/read-all")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<?>> markAllAsRead(
            @AuthenticationPrincipal User user) {

        notificationService.markAllAsRead(user.getId());

        return ResponseEntity.ok(
                new ApiResponse<>(true, "All notifications marked as read.")
        );
    }

    @DeleteMapping("/{notificationId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteNotification(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal User user) {

        notificationService.deleteNotification(notificationId, user);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Notification deleted successfully.")
        );
    }
}