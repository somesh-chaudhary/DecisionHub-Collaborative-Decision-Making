package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.PlatformAnalyticsDto;
import com.example.backend.service.AnalyticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<PlatformAnalyticsDto>> getOverviewAnalytics(
            @RequestParam(required = false, defaultValue = "monthly") String period) {
        PlatformAnalyticsDto analytics = analyticsService.getPlatformAnalytics(period);
        return ResponseEntity.ok(
                ApiResponse.<PlatformAnalyticsDto>builder()
                        .success(true)
                        .message("Analytics data fetched successfully.")
                        .data(analytics)
                        .build()
        );
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlatformAnalyticsDto>> getAdminAnalytics(
            @RequestParam(required = false, defaultValue = "monthly") String period) {
        PlatformAnalyticsDto analytics = analyticsService.getPlatformAnalytics(period);
        return ResponseEntity.ok(
                ApiResponse.<PlatformAnalyticsDto>builder()
                        .success(true)
                        .message("Admin analytics fetched successfully.")
                        .data(analytics)
                        .build()
        );
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam(required = false, defaultValue = "decisions") String type) {
        String csvData = analyticsService.generateReportCsv(type);
        byte[] output = csvData.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        String filename = type.toLowerCase() + "_report_" + java.time.LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(output);
    }
}
