package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.MetricsSummaryDto;
import com.example.backend.dto.UserDto;
import com.example.backend.entity.User;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.CommunityRepository;
import com.example.backend.repository.VoteRepository;
import com.example.backend.service.CommunityService;
import com.example.backend.service.DecisionService;
import com.example.backend.service.NotificationService;
import com.example.backend.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final CommunityService communityService;
    private final DecisionService decisionService;
    private final NotificationService notificationService;
    private final CommunityRepository communityRepository;
    private final VoteRepository voteRepository;
    private final CommentRepository commentRepository;

    public AdminController(UserService userService,
                           CommunityService communityService,
                           DecisionService decisionService,
                           NotificationService notificationService,
                           CommunityRepository communityRepository,
                           VoteRepository voteRepository,
                           CommentRepository commentRepository) {
        this.userService = userService;
        this.communityService = communityService;
        this.decisionService = decisionService;
        this.notificationService = notificationService;
        this.communityRepository = communityRepository;
        this.voteRepository = voteRepository;
        this.commentRepository = commentRepository;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(
            ApiResponse.<List<UserDto>>builder()
                .success(true)
                .message("Users fetched successfully.")
                .data(users)
                .build()
        );
    }

    @RequestMapping(value = "/users/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateUserStatus(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload,
            @RequestParam(required = false) String status) {
        String newStatus = (payload != null && payload.containsKey("status")) ? payload.get("status") : status;
        UserDto updatedUser = userService.updateUserStatus(id, newStatus);
        return ResponseEntity.ok(
            ApiResponse.<UserDto>builder()
                .success(true)
                .message("User status updated successfully.")
                .data(updatedUser)
                .build()
        );
    }

    @RequestMapping(value = "/users/{id}/role", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateUserRole(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload,
            @RequestParam(required = false) String role) {
        String newRole = (payload != null && payload.containsKey("role")) ? payload.get("role") : role;
        UserDto updatedUser = userService.updateUserRole(id, newRole);
        return ResponseEntity.ok(
            ApiResponse.<UserDto>builder()
                .success(true)
                .message("User role updated successfully.")
                .data(updatedUser)
                .build()
        );
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        userService.deleteUser(id, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "User deleted successfully."));
    }

    @DeleteMapping("/communities/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteCommunity(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        communityService.deleteCommunity(id, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Community deleted successfully."));
    }

    @DeleteMapping("/boards/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteBoard(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        decisionService.deleteDecision(id, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Board deleted successfully."));
    }

    @GetMapping("/metrics/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MetricsSummaryDto>> getMetricsSummary() {
        MetricsSummaryDto summary = MetricsSummaryDto.builder()
                .totalUsers(userService.countUsers())
                .activeUsers(userService.countActiveUsers())
                .suspendedUsers(userService.countSuspendedUsers())
                .totalCommunities(communityRepository.count())
                .totalDecisions(decisionService.countDecisions())
                .totalVotes(voteRepository.count())
                .totalComments(commentRepository.count())
                .build();

        return ResponseEntity.ok(
            ApiResponse.<MetricsSummaryDto>builder()
                .success(true)
                .message("Metrics summary fetched successfully.")
                .data(summary)
                .build()
        );
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> broadcastAnnouncement(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User admin) {
        String title = payload.get("title");
        String message = payload.get("message");
        String target = payload.get("target");

        if (title == null || title.trim().isEmpty() || message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                ApiResponse.<Map<String, Object>>builder()
                    .success(false)
                    .message("Title and message are required for broadcast.")
                    .build()
            );
        }

        int count = notificationService.broadcastAnnouncement(title, message, target, admin);
        return ResponseEntity.ok(
            ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Broadcast sent successfully to " + count + " users.")
                .data(Map.of("deliveredCount", count))
                .build()
        );
    }
}
