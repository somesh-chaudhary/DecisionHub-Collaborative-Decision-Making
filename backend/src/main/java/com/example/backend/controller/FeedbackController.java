package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.FeedbackDto;
import com.example.backend.dto.FeedbackReplyRequest;
import com.example.backend.dto.FeedbackRequest;
import com.example.backend.entity.User;
import com.example.backend.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<FeedbackDto>> createFeedback(
            @Valid @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal User user) {

        FeedbackDto dto = feedbackService.createFeedback(request, user);

        return ResponseEntity.ok(ApiResponse.<FeedbackDto>builder()
                .success(true)
                .message("Feedback submitted successfully.")
                .data(dto)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<FeedbackDto>>> getFeedbacks(
            @AuthenticationPrincipal User user) {

        List<FeedbackDto> list = feedbackService.getFeedbacks(user);

        return ResponseEntity.ok(ApiResponse.<List<FeedbackDto>>builder()
                .success(true)
                .message("Feedbacks fetched successfully.")
                .data(list)
                .build());
    }

    @PostMapping("/{id}/reply")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FeedbackDto>> replyToFeedback(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackReplyRequest request,
            @AuthenticationPrincipal User admin) {

        FeedbackDto dto = feedbackService.replyToFeedback(id, request, admin);

        return ResponseEntity.ok(ApiResponse.<FeedbackDto>builder()
                .success(true)
                .message("Reply posted successfully.")
                .data(dto)
                .build());
    }

    @DeleteMapping("/{id}/reply")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FeedbackDto>> deleteReply(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {

        FeedbackDto dto = feedbackService.deleteReply(id, admin);

        return ResponseEntity.ok(ApiResponse.<FeedbackDto>builder()
                .success(true)
                .message("Reply removed successfully.")
                .data(dto)
                .build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FeedbackDto>> updateFeedbackStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User admin) {

        FeedbackDto dto = feedbackService.updateFeedbackStatus(id, payload, admin);

        return ResponseEntity.ok(ApiResponse.<FeedbackDto>builder()
                .success(true)
                .message("Feedback status updated successfully.")
                .data(dto)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteFeedback(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        feedbackService.deleteFeedback(id, user);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Feedback deleted successfully.")
                .build());
    }
}
