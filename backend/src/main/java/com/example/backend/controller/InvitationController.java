package com.example.backend.controller;

import java.util.List;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.example.backend.dto.*;
import com.example.backend.entity.User;
import com.example.backend.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','ADMIN')")
public class InvitationController {
    private final InvitationService invitationService;

    @PostMapping("/api/decisions/{decisionId}/invitations")
    public ResponseEntity<ApiResponse<InvitationDto>> invite(@PathVariable Long decisionId,
            @Valid @RequestBody InvitationRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<InvitationDto>builder()
                .success(true).message("Invitation sent successfully.")
                .data(invitationService.invite(decisionId, request, user)).build());
    }

    @GetMapping("/api/invitations")
    public ResponseEntity<ApiResponse<List<InvitationDto>>> myInvitations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.<List<InvitationDto>>builder().success(true)
                .message("Invitations fetched successfully.").data(invitationService.myInvitations(user)).build());
    }

    @PatchMapping("/api/invitations/{id}/{status}")
    public ResponseEntity<ApiResponse<InvitationDto>> updateStatus(@PathVariable Long id,
            @PathVariable String status, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.<InvitationDto>builder().success(true)
                .message("Invitation status updated successfully.")
                .data(invitationService.updateStatus(id, status, user)).build());
    }
}
