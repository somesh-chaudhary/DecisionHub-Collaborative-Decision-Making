package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.OptionDto;
import com.example.backend.dto.OptionRequest;
import com.example.backend.entity.User;
import com.example.backend.service.OptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/decisions/{decisionId}/options")
@RequiredArgsConstructor
public class OptionController {

    private final OptionService optionService;

    @PutMapping("/{optionId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<OptionDto>> updateOption(
            @PathVariable Long decisionId,
            @PathVariable Long optionId,
            @RequestBody OptionRequest request,
            @AuthenticationPrincipal User user) {

        OptionDto option =
                optionService.updateOption(decisionId, optionId, request, user);

        return ResponseEntity.ok(
                ApiResponse.<OptionDto>builder()
                        .success(true)
                        .message("Option updated successfully.")
                        .data(option)
                        .build()
        );
    }
    @PostMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<OptionDto>> addOption(
            @PathVariable Long decisionId,
            @RequestBody OptionRequest request,
            @AuthenticationPrincipal User user) {

        OptionDto option = optionService.addOption(decisionId, request, user);

        return ResponseEntity.ok(
                ApiResponse.<OptionDto>builder()
                        .success(true)
                        .message("Option added successfully.")
                        .data(option)
                        .build()
        );
    }
    @DeleteMapping("/{optionId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteOption(
            @PathVariable Long decisionId,
            @PathVariable Long optionId,
            @AuthenticationPrincipal User user) {

        optionService.deleteOption(decisionId, optionId, user);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Option deleted successfully."));
    }
    @GetMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<OptionDto>>> getAllOptions(
            @PathVariable Long decisionId) {

        List<OptionDto> options = optionService.getAllOptions(decisionId);

        return ResponseEntity.ok(
                ApiResponse.<List<OptionDto>>builder()
                        .success(true)
                        .message("Options fetched successfully.")
                        .data(options)
                        .build()
        );
    }
}