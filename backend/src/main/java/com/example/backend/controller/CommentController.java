package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.CommentDto;
import com.example.backend.dto.CommentRequest;
import com.example.backend.entity.User;
import com.example.backend.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    
    @PostMapping("/api/decisions/{decisionId}/comments")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<CommentDto>> createComment(
            @PathVariable Long decisionId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User user) {

        CommentDto dto = commentService.createComment(decisionId, request, user);

        return ResponseEntity.ok(
                ApiResponse.<CommentDto>builder()
                        .success(true)
                        .message("Comment added successfully.")
                        .data(dto)
                        .build()
        );
    }
    
    @PostMapping("/api/comments/{parentCommentId}/replies")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<CommentDto>> replyToComment(
            @PathVariable Long parentCommentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User user) {

        CommentDto dto = commentService.replyToComment(parentCommentId, request, user);

        return ResponseEntity.ok(
                ApiResponse.<CommentDto>builder()
                        .success(true)
                        .message("Reply added successfully.")
                        .data(dto)
                        .build()
        );
    }
    
    @GetMapping("/api/decisions/{decisionId}/comments")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<CommentDto>>> getComments(
            @PathVariable Long decisionId) {

        List<CommentDto> comments = commentService.getComments(decisionId);

        return ResponseEntity.ok(
                ApiResponse.<List<CommentDto>>builder()
                        .success(true)
                        .message("Comments fetched successfully.")
                        .data(comments)
                        .build()
        );
    }
    
    @PutMapping("/api/comments/{commentId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<CommentDto>> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User user) {

        CommentDto dto = commentService.updateComment(commentId, request, user);

        return ResponseEntity.ok(
                ApiResponse.<CommentDto>builder()
                        .success(true)
                        .message("Comment updated successfully.")
                        .data(dto)
                        .build()
        );
    }
    
    @DeleteMapping("/api/comments/{commentId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal User user) {

        commentService.deleteComment(commentId, user);

        return ResponseEntity.ok(
                ApiResponse.builder()
                        .success(true)
                        .message("Comment deleted successfully.")
                        .build()
        );
    }

    @PutMapping("/api/comments/{commentId}/pin")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<CommentDto>> togglePinComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal User user) {

        CommentDto dto = commentService.togglePinComment(commentId, user);
        String msg = Boolean.TRUE.equals(dto.getIsPinned()) ? "Comment pinned successfully." : "Comment unpinned successfully.";

        return ResponseEntity.ok(
                ApiResponse.<CommentDto>builder()
                        .success(true)
                        .message(msg)
                        .data(dto)
                        .build()
        );
    }

    @PatchMapping("/api/comments/{commentId}/pin")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<CommentDto>> togglePinCommentPatch(
            @PathVariable Long commentId,
            @AuthenticationPrincipal User user) {
        return togglePinComment(commentId, user);
    }

    @PutMapping("/api/comments/{commentId}/hide")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<CommentDto>> toggleHideComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal User user) {

        CommentDto dto = commentService.toggleHideComment(commentId, user);
        String msg = Boolean.TRUE.equals(dto.getIsHidden()) ? "Comment hidden successfully." : "Comment unhidden successfully.";

        return ResponseEntity.ok(
                ApiResponse.<CommentDto>builder()
                        .success(true)
                        .message(msg)
                        .data(dto)
                        .build()
        );
    }

    @PatchMapping("/api/comments/{commentId}/hide")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<CommentDto>> toggleHideCommentPatch(
            @PathVariable Long commentId,
            @AuthenticationPrincipal User user) {
        return toggleHideComment(commentId, user);
    }

}