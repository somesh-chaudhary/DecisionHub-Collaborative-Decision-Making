package com.example.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CommunityJoinRequestDto {
    private Long id;
    private Long communityId;
    private Long userId;
    private String username;
    private String status;
    private LocalDateTime createdAt;
}
