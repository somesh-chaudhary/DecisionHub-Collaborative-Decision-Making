package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComparisonParameterRequest {
    private String name;
    private String unit;
    private Double weight;
    private Boolean higherIsBetter;
}
