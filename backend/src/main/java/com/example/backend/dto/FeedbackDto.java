package com.example.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackDto {

    private Long id;
    private Long userId;
    private String username;
    private Integer rating;
    private String category;
    private String comment;
    private String status;
    private String adminReply;
    private LocalDateTime adminRepliedAt;
    private Boolean isDeleted;
    private List<FeedbackReplyDto> replies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
