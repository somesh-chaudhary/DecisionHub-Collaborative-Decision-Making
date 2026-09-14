package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.CommunityDto;
import com.example.backend.dto.CommunityJoinRequestDto;
import com.example.backend.dto.CommunityMemberDto;
import com.example.backend.dto.CommunityMembershipStatusDto;
import com.example.backend.dto.CreateCommunityRequest;
import com.example.backend.dto.HandleJoinRequestDto;
import com.example.backend.dto.ModerationActionRequestDto;
import com.example.backend.dto.ReportResponseDto;
import com.example.backend.dto.UpdateCommunityRequest;
import com.example.backend.entity.User;
import com.example.backend.service.CommunityService;
import com.example.backend.service.ModerationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/communities")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;
    private final ModerationService moderationService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<CommunityDto>> createCommunity(@Valid @RequestBody CreateCommunityRequest request, 
                                                        @AuthenticationPrincipal User user) {
        CommunityDto community = communityService.createCommunity(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.<CommunityDto>builder()
                .success(true)
                .message("Community created successfully.")
                .data(community)
                .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommunityDto>>> getAllCommunities() {
        List<CommunityDto> communities = communityService.getAllCommunities();
        String message = communities.isEmpty() ? "No communities found." : "Communities fetched successfully.";
        return ResponseEntity.ok(
            ApiResponse.<List<CommunityDto>>builder()
                .success(true)
                .message(message)
                .data(communities)
                .build()
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<CommunityDto>> getCommunityById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        CommunityDto community = communityService.getCommunityById(id, user);

        return ResponseEntity.ok(
            ApiResponse.<CommunityDto>builder()
                .success(true)
                .message("Community fetched successfully.")
                .data(community)
                .build()
        );
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<CommunityDto>> updateCommunity(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCommunityRequest request,
            @AuthenticationPrincipal User user) {

        CommunityDto community =
                communityService.updateCommunity(id, request, user);

        return ResponseEntity.ok(
                ApiResponse.<CommunityDto>builder()
                        .success(true)
                        .message("Community updated successfully.")
                        .data(community)
                        .build()
        );
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<String>> joinCommunity(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        String result = communityService.joinCommunity(id, user);
        return ResponseEntity.ok(ApiResponse.<String>builder().success(true).message("Join request processed.").data(result).build());
    }

    @GetMapping("/{id}/requests")
    public ResponseEntity<ApiResponse<List<CommunityJoinRequestDto>>> getPendingRequests(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        List<CommunityJoinRequestDto> requests = communityService.getPendingRequests(id, user);
        return ResponseEntity.ok(ApiResponse.<List<CommunityJoinRequestDto>>builder().success(true).message("Pending requests fetched.").data(requests).build());
    }

    @PostMapping("/requests/{requestId}/handle")
    public ResponseEntity<ApiResponse<String>> handleJoinRequest(
            @PathVariable Long requestId,
            @RequestBody HandleJoinRequestDto handleRequestDto,
            @AuthenticationPrincipal User user) {
        String result = communityService.handleJoinRequest(requestId, handleRequestDto.isAccept(), user);
        return ResponseEntity.ok(ApiResponse.<String>builder().success(true).message("Join request handled.").data(result).build());
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<?>> removeMember(@PathVariable Long id, @PathVariable Long userId, @AuthenticationPrincipal User user) {
        communityService.removeMember(id, userId, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Member removed successfully."));
    }

    
    @GetMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<CommunityMemberDto>>> getCommunityMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        List<CommunityMemberDto> members =
                communityService.getCommunityMembers(id, user);

        return ResponseEntity.ok(
                ApiResponse.<List<CommunityMemberDto>>builder()
                        .success(true)
                        .message("Community members fetched successfully.")
                        .data(members)
                        .build());
    }
    
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteCommunity(@PathVariable Long id, @AuthenticationPrincipal User user) {
        communityService.deleteCommunity(id, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Community deleted successfully."));
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Long>> countCommunities() {
        return ResponseEntity.ok(
            ApiResponse.<Long>builder()
                .success(true)
                .message("Community count fetched successfully.")
                .data(communityService.countCommunities())
                .build()
        );
    }
    
    @GetMapping("/{id}/membership")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<CommunityMembershipStatusDto>> getMembershipStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        CommunityMembershipStatusDto status =
                communityService.getMembershipStatus(id, user);

        return ResponseEntity.ok(
                ApiResponse.<CommunityMembershipStatusDto>builder()
                        .success(true)
                        .message("Membership status fetched successfully.")
                        .data(status)
                        .build()
        );
    }

    @GetMapping("/{id}/reports")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<ReportResponseDto>>> getCommunityReports(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @AuthenticationPrincipal User user) {

        List<ReportResponseDto> reports = moderationService.getCommunityReports(id, user, status);
        return ResponseEntity.ok(
                ApiResponse.<List<ReportResponseDto>>builder()
                        .success(true)
                        .message("Community reports fetched successfully.")
                        .data(reports)
                        .build()
        );
    }

    @PostMapping("/{id}/reports/{reportId}/action")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponseDto>> executeCommunityReportAction(
            @PathVariable Long id,
            @PathVariable Long reportId,
            @Valid @RequestBody ModerationActionRequestDto request,
            @AuthenticationPrincipal User user) {

        ReportResponseDto dto = moderationService.executeCommunityAction(id, reportId, request, user);
        return ResponseEntity.ok(
                ApiResponse.<ReportResponseDto>builder()
                        .success(true)
                        .message("Community moderation action executed successfully.")
                        .data(dto)
                        .build()
        );
    }

    @PostMapping("/{id}/reports/{reportId}/dismiss")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponseDto>> dismissCommunityReport(
            @PathVariable Long id,
            @PathVariable Long reportId,
            @RequestBody(required = false) Map<String, String> payload,
            @AuthenticationPrincipal User user) {

        String notes = payload != null ? payload.get("notes") : null;
        ReportResponseDto dto = moderationService.dismissCommunityReport(id, reportId, user, notes);
        return ResponseEntity.ok(
                ApiResponse.<ReportResponseDto>builder()
                        .success(true)
                        .message("Community report dismissed.")
                        .data(dto)
                        .build()
        );
    }
}
