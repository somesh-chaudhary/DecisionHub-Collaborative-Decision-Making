package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TopCommunityDto {
    private Long id;
    private String name;
    private long value;
    private long memberCount;
    private long decisionCount;
}
