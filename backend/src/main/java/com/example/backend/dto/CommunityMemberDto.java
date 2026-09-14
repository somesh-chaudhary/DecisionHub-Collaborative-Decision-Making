package com.example.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommunityMemberDto {

    private Long userId;
    private String username;
    private String fullName;
    private String memberRole;
}