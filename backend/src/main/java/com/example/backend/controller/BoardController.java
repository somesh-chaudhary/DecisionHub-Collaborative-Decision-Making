package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boards")
public class BoardController {

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<?>> getBoardById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Board fetched successfully."));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<?>> updateBoardStatus(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Board status updated successfully."));
    }

    @PostMapping("/{id}/votes")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<?>> voteOnBoard(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Voted on board successfully."));
    }

    @DeleteMapping("/{id}/votes")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<?>> removeVoteFromBoard(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Vote removed successfully."));
    }
}
