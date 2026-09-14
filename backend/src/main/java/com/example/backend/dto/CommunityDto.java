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
public class CommunityDto {
    private Long id;
    private String name;
    private String category;
    private String description;
    private Long moderatorId;
    private String moderatorUsername;
    private Integer memberCount;
    private LocalDateTime createdAt;
    private boolean isJoined;
    private boolean isPending;
    private boolean isModerator;
}
