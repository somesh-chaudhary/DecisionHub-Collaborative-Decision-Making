package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.entity.User;
import com.example.backend.service.ComparisonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/decisions/{decisionId}/comparison")
@RequiredArgsConstructor
public class ComparisonController {

    private final ComparisonService comparisonService;

    // ==========================================
    // PARAMETERS ENDPOINTS
    // ==========================================

    @PostMapping("/parameters")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<ComparisonParameterDto>> addParameter(
            @PathVariable Long decisionId,
            @RequestBody ComparisonParameterRequest request,
            @AuthenticationPrincipal User user) {

        ComparisonParameterDto dto = comparisonService.addParameter(decisionId, request, user);
        return ResponseEntity.ok(
                ApiResponse.<ComparisonParameterDto>builder()
                        .success(true)
                        .message("Comparison parameter added successfully.")
                        .data(dto)
                        .build()
        );
    }

    @GetMapping("/parameters")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<ComparisonParameterDto>>> getParameters(
            @PathVariable Long decisionId) {

        List<ComparisonParameterDto> dtos = comparisonService.getParametersByDecision(decisionId);
        return ResponseEntity.ok(
                ApiResponse.<List<ComparisonParameterDto>>builder()
                        .success(true)
                        .message("Comparison parameters fetched successfully.")
                        .data(dtos)
                        .build()
        );
    }

    @PutMapping("/parameters/{parameterId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<ComparisonParameterDto>> updateParameter(
            @PathVariable Long decisionId,
            @PathVariable Long parameterId,
            @RequestBody ComparisonParameterRequest request,
            @AuthenticationPrincipal User user) {

        ComparisonParameterDto dto = comparisonService.updateParameter(decisionId, parameterId, request, user);
        return ResponseEntity.ok(
                ApiResponse.<ComparisonParameterDto>builder()
                        .success(true)
                        .message("Comparison parameter updated successfully.")
                        .data(dto)
                        .build()
        );
    }

    @DeleteMapping("/parameters/{parameterId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteParameter(
            @PathVariable Long decisionId,
            @PathVariable Long parameterId,
            @AuthenticationPrincipal User user) {

        comparisonService.deleteParameter(decisionId, parameterId, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Comparison parameter deleted successfully."));
    }

    // ==========================================
    // VALUES ENDPOINTS
    // ==========================================

    @PostMapping("/options/{optionId}/values")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<OptionParameterValueDto>> saveOptionValue(
            @PathVariable Long decisionId,
            @PathVariable Long optionId,
            @RequestBody OptionParameterValueRequest request,
            @AuthenticationPrincipal User user) {

        OptionParameterValueDto dto = comparisonService.saveOptionParameterValue(decisionId, optionId, request, user);
        return ResponseEntity.ok(
                ApiResponse.<OptionParameterValueDto>builder()
                        .success(true)
                        .message("Option parameter value saved successfully.")
                        .data(dto)
                        .build()
        );
    }

    @PostMapping("/values")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<OptionParameterValueDto>>> bulkSaveValues(
            @PathVariable Long decisionId,
            @RequestBody BulkValueSaveRequest request,
            @AuthenticationPrincipal User user) {

        List<OptionParameterValueDto> dtos = comparisonService.bulkSaveParameterValues(decisionId, request, user);
        return ResponseEntity.ok(
                ApiResponse.<List<OptionParameterValueDto>>builder()
                        .success(true)
                        .message("Parameter values saved in bulk successfully.")
                        .data(dtos)
                        .build()
        );
    }

    // ==========================================
    // COMPARISON TABLE & SCORING ENDPOINT
    // ==========================================

    @GetMapping("/table")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<ComparisonTableDto>> getComparisonTable(
            @PathVariable Long decisionId) {

        ComparisonTableDto table = comparisonService.getComparisonTable(decisionId);
        return ResponseEntity.ok(
                ApiResponse.<ComparisonTableDto>builder()
                        .success(true)
                        .message("Comparison table calculated and retrieved successfully.")
                        .data(table)
                        .build()
        );
    }
}
