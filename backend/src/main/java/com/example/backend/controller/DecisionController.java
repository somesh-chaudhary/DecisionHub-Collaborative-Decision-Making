package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.DecisionRequest;
import com.example.backend.dto.DecisionDto;
import com.example.backend.dto.VoteDto;
import com.example.backend.dto.VoteRequest;
import com.example.backend.entity.User;
import com.example.backend.service.DecisionService;
import com.example.backend.service.VoteService;

@RestController
@RequestMapping("/api/decisions")
public class DecisionController {

    private final DecisionService decisionService;
    private final VoteService voteService;

    public DecisionController(DecisionService decisionService, VoteService voteService) {
        this.decisionService = decisionService;
        this.voteService = voteService;
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<DecisionDto>> createDecision(
            @RequestBody DecisionRequest request,
            @AuthenticationPrincipal User user) {

        DecisionDto decision =
                decisionService.createDecision(request, user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<DecisionDto>builder()
                        .success(true)
                        .message("Decision created successfully.")
                        .data(decision)
                        .build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<DecisionDto>>> getAllDecisions(@AuthenticationPrincipal User user) {

        List<DecisionDto> decisions = decisionService.getAllDecisions(user);
        String message = decisions.isEmpty() ? "No decisions found." : "Decisions fetched successfully.";

        return ResponseEntity.ok(ApiResponse.<List<DecisionDto>>builder()
                .success(true)
                .message(message)
                .data(decisions)
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<DecisionDto>> getDecisionById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        DecisionDto decision = decisionService.getDecisionById(id, user);

        return ResponseEntity.ok(ApiResponse.<DecisionDto>builder()
                .success(true)
                .message("Decision fetched successfully.")
                .data(decision)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<DecisionDto>> updateDecision(
            @PathVariable Long id,
            @RequestBody DecisionRequest request,
            @AuthenticationPrincipal User user) {

        DecisionDto decision = decisionService.updateDecision(
                        id,
                        request,
                        user);

        return ResponseEntity.ok(ApiResponse.<DecisionDto>builder()
                .success(true)
                .message("Decision updated successfully.")
                .data(decision)
                .build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<DecisionDto>> updateDecisionStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User user) {

        DecisionDto decision = decisionService.updateDecisionStatus(id, payload, user);

        return ResponseEntity.ok(ApiResponse.<DecisionDto>builder()
                .success(true)
                .message("Decision status updated successfully.")
                .data(decision)
                .build());
    }

    @PutMapping("/{id}/lock")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<DecisionDto>> toggleLockDiscussion(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        DecisionDto decision = decisionService.toggleLockDiscussion(id, user);
        String msg = Boolean.TRUE.equals(decision.getIsDiscussionLocked()) 
                ? "Discussion locked successfully." 
                : "Discussion unlocked successfully.";

        return ResponseEntity.ok(ApiResponse.<DecisionDto>builder()
                .success(true)
                .message(msg)
                .data(decision)
                .build());
    }

    @PatchMapping("/{id}/lock")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<DecisionDto>> toggleLockDiscussionPatch(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return toggleLockDiscussion(id, user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteDecision(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        decisionService.deleteDecision(id, user);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Decision deleted successfully!"));
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Long>> countDecisions() {
        return ResponseEntity.ok(
            ApiResponse.<Long>builder()
                .success(true)
                .message("Decision count fetched successfully.")
                .data(decisionService.countDecisions())
                .build()
        );
    }

    @PostMapping("/{id}/votes")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<VoteDto>> castVote(
            @PathVariable Long id,
            @RequestBody VoteRequest request,
            @AuthenticationPrincipal User user) {

        VoteDto vote = voteService.castVote(id, request, user);

        return ResponseEntity.ok(ApiResponse.<VoteDto>builder()
                .success(true)
                .message("Vote cast successfully.")
                .data(vote)
                .build());
    }

    @DeleteMapping("/{id}/votes")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<?>> removeVote(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        voteService.removeVote(id, user);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Vote retracted successfully."));
    }
}