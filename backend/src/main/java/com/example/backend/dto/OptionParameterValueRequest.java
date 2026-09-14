package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptionParameterValueRequest {
    private Long optionId;
    private Long parameterId;
    private String stringValue;
    private Double numericValue;
    private Double score;
}
