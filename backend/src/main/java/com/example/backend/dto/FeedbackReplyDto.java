package com.example.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackReplyDto {

    private Long id;
    private Long feedbackId;
    private Long userId;
    private String username;
    private String userRole;
    private String message;
    private LocalDateTime createdAt;
}
