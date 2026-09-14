package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/communities/{id}/boards")
public class CommunityBoardController {

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<?>> createBoard(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Board created successfully."));
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<?>> getBoardsForCommunity(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Boards fetched successfully."));
    }
}
