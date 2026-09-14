package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.ModerationActionRequestDto;
import com.example.backend.dto.ReportRequestDto;
import com.example.backend.dto.ReportResponseDto;
import com.example.backend.entity.User;
import com.example.backend.service.ModerationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/moderation")
public class ModerationController {

    private final ModerationService moderationService;

    public ModerationController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @PostMapping("/reports")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponseDto>> submitReport(
            @Valid @RequestBody ReportRequestDto request,
            @AuthenticationPrincipal User user) {

        ReportResponseDto dto = moderationService.createReport(request, user);
        return ResponseEntity.ok(
                ApiResponse.<ReportResponseDto>builder()
                        .success(true)
                        .message("Report submitted successfully. Our moderation team will review it shortly.")
                        .data(dto)
                        .build()
        );
    }

    @GetMapping("/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ReportResponseDto>>> getReports(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "ALL") String type) {

        List<ReportResponseDto> reports = moderationService.getReports(status, type);
        return ResponseEntity.ok(
                ApiResponse.<List<ReportResponseDto>>builder()
                        .success(true)
                        .message("Reports fetched successfully.")
                        .data(reports)
                        .build()
        );
    }

    @GetMapping("/reports/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponseDto>> getReportById(@PathVariable Long id) {
        ReportResponseDto dto = moderationService.getReportById(id);
        return ResponseEntity.ok(
                ApiResponse.<ReportResponseDto>builder()
                        .success(true)
                        .message("Report details fetched.")
                        .data(dto)
                        .build()
        );
    }

    @PostMapping("/reports/{id}/dismiss")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponseDto>> dismissReport(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload,
            @AuthenticationPrincipal User admin) {

        String notes = payload != null ? payload.get("notes") : null;
        ReportResponseDto dto = moderationService.dismissReport(id, admin, notes);
        return ResponseEntity.ok(
                ApiResponse.<ReportResponseDto>builder()
                        .success(true)
                        .message("Report dismissed.")
                        .data(dto)
                        .build()
        );
    }

    @PostMapping("/reports/{id}/action")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponseDto>> executeModerationAction(
            @PathVariable Long id,
            @Valid @RequestBody ModerationActionRequestDto request,
            @AuthenticationPrincipal User admin) {

        ReportResponseDto dto = moderationService.executeAction(id, request, admin);
        return ResponseEntity.ok(
                ApiResponse.<ReportResponseDto>builder()
                        .success(true)
                        .message("Moderation action '" + request.getAction() + "' executed successfully.")
                        .data(dto)
                        .build()
        );
    }
}
