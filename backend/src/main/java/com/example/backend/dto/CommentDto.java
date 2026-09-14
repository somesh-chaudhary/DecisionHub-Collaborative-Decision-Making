package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDto {

    private Long commentId;

    private Long userId;

    private String username;

    private String commentText;

    private LocalDateTime createdAt;

    @Builder.Default
    private Boolean isPinned = false;

    @Builder.Default
    private Boolean isHidden = false;

    private List<CommentDto> replies;
}