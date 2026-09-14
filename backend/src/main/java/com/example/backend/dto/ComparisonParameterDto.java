package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComparisonParameterDto {
    private Long id;
    private Long decisionId;
    private String name;
    private String unit;
    private Double weight;
    private Boolean higherIsBetter;
    private LocalDateTime createdAt;
}
