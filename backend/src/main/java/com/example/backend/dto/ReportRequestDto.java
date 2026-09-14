package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportRequestDto {

    @NotBlank(message = "Target type is required (e.g. BOARD, USER, COMMENT, COMMUNITY)")
    private String targetType;

    private Long targetId;

    private String targetTitle;

    private Long reportedUserId;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String details;
}
