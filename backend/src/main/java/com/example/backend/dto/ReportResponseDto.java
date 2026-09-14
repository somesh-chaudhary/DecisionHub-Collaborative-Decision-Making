package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportResponseDto {
    private Long id;
    private String targetType;
    private Long targetId;
    private String targetTitle;

    private Long communityId;
    private String communityName;

    private Long decisionId;
    private String decisionTitle;

    private Long reporterId;
    private String reporterUsername;
    private String reporterEmail;

    private Long reportedUserId;
    private String reportedUsername;
    private String reportedEmail;

    private String reason;
    private String details;
    private String status;
    private String actionTaken;
    private String moderatorNotes;

    private Long moderatorId;
    private String moderatorUsername;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
