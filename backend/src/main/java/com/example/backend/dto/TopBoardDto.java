package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TopBoardDto {
    private Long id;
    private String name;
    private long votes;
    private long comments;
    private String category;
    private String communityName;
}
