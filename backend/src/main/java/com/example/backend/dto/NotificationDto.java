package com.example.backend.dto;

import java.time.LocalDateTime;

import com.example.backend.entity.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {

    private Long id;

    private Long senderId;

    private String senderUsername;

    private NotificationType type;

    private String title;

    private String message;

    private Long decisionId;

    private Long communityId;

    private Long referenceId;

    private boolean read;

    private LocalDateTime createdAt;
}