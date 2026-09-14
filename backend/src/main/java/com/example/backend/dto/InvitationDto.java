package com.example.backend.dto;

import java.time.LocalDateTime;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationDto {
    private Long id;
    private Long decisionId;
    private String decisionTitle;
    private Long inviterId;
    private String inviterUsername;
    private Long inviteeId;
    private String inviteeUsername;
    private String status;
    private LocalDateTime createdAt;
}
