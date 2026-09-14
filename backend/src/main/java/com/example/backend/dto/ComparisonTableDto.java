package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComparisonTableDto {
    private Long decisionId;
    private String decisionTitle;
    private String decisionDescription;
    private List<ComparisonParameterDto> parameters;
    private List<OptionComparisonDto> options;
    private OptionComparisonDto recommendedOption;
    private String analyticalSummary;
}
