package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptionComparisonDto {
    private Long optionId;
    private String optionTitle;
    private String description;
    private String pros;
    private String cons;
    private List<OptionParameterValueDto> parameterValuesList;
    private Map<Long, OptionParameterValueDto> parameterValuesMap;
    private Double totalScore;
    private Integer rank;
}
