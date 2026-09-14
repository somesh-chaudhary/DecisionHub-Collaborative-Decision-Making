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
public class OptionParameterValueDto {
    private Long id;
    private Long optionId;
    private Long parameterId;
    private String parameterName;
    private String stringValue;
    private Double numericValue;
    private Double score;
    private LocalDateTime updatedAt;
}
