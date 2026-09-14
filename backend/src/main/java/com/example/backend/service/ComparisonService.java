package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.*;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedActionException;
import com.example.backend.repository.ComparisonParameterRepository;
import com.example.backend.repository.DecisionRepository;
import com.example.backend.repository.OptionParameterValueRepository;
import com.example.backend.repository.OptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComparisonService {

    private final ComparisonParameterRepository parameterRepository;
    private final OptionParameterValueRepository valueRepository;
    private final DecisionRepository decisionRepository;
    private final OptionRepository optionRepository;

    // ==========================================
    // PARAMETER MANAGEMENT
    // ==========================================

    @Transactional
    public ComparisonParameterDto addParameter(Long decisionId, ComparisonParameterRequest request, User requester) {
        Decision decision = getDecisionOrThrow(decisionId);
        validateOwnerOrAdmin(decision, requester);

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BadRequestException("Parameter name cannot be empty.");
        }

        ComparisonParameter parameter = ComparisonParameter.builder()
                .decision(decision)
                .name(request.getName().trim())
                .unit(request.getUnit() != null ? request.getUnit().trim() : "")
                .weight(request.getWeight() != null && request.getWeight() > 0 ? request.getWeight() : 1.0)
                .higherIsBetter(request.getHigherIsBetter() != null ? request.getHigherIsBetter() : true)
                .build();

        ComparisonParameter saved = parameterRepository.save(parameter);
        return convertToParameterDto(saved);
    }

    @Transactional
    public ComparisonParameterDto updateParameter(Long decisionId, Long parameterId, ComparisonParameterRequest request, User requester) {
        Decision decision = getDecisionOrThrow(decisionId);
        validateOwnerOrAdmin(decision, requester);

        ComparisonParameter parameter = parameterRepository.findById(parameterId)
                .orElseThrow(() -> new ResourceNotFoundException("Comparison parameter not found."));

        if (!parameter.getDecision().getId().equals(decisionId)) {
            throw new BadRequestException("Parameter does not belong to this decision.");
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            parameter.setName(request.getName().trim());
        }
        if (request.getUnit() != null) {
            parameter.setUnit(request.getUnit().trim());
        }
        if (request.getWeight() != null && request.getWeight() > 0) {
            parameter.setWeight(request.getWeight());
        }
        if (request.getHigherIsBetter() != null) {
            parameter.setHigherIsBetter(request.getHigherIsBetter());
        }

        ComparisonParameter updated = parameterRepository.save(parameter);
        return convertToParameterDto(updated);
    }

    @Transactional
    public void deleteParameter(Long decisionId, Long parameterId, User requester) {
        Decision decision = getDecisionOrThrow(decisionId);
        validateOwnerOrAdmin(decision, requester);

        ComparisonParameter parameter = parameterRepository.findById(parameterId)
                .orElseThrow(() -> new ResourceNotFoundException("Comparison parameter not found."));

        if (!parameter.getDecision().getId().equals(decisionId)) {
            throw new BadRequestException("Parameter does not belong to this decision.");
        }

        parameterRepository.delete(parameter);
    }

    @Transactional(readOnly = true)
    public List<ComparisonParameterDto> getParametersByDecision(Long decisionId) {
        getDecisionOrThrow(decisionId);
        return parameterRepository.findByDecisionId(decisionId).stream()
                .map(this::convertToParameterDto)
                .collect(Collectors.toList());
    }

    // ==========================================
    // PARAMETER VALUES MANAGEMENT
    // ==========================================

    @Transactional
    public OptionParameterValueDto saveOptionParameterValue(Long decisionId, Long optionId, OptionParameterValueRequest request, User requester) {
        Decision decision = getDecisionOrThrow(decisionId);
        validateOwnerOrAdmin(decision, requester);

        Option option = optionRepository.findById(optionId)
                .orElseThrow(() -> new ResourceNotFoundException("Option not found."));
        if (!option.getDecision().getId().equals(decisionId)) {
            throw new BadRequestException("Option does not belong to this decision.");
        }

        ComparisonParameter parameter = parameterRepository.findById(request.getParameterId())
                .orElseThrow(() -> new ResourceNotFoundException("Parameter not found."));
        if (!parameter.getDecision().getId().equals(decisionId)) {
            throw new BadRequestException("Parameter does not belong to this decision.");
        }

        OptionParameterValue val = valueRepository.findByOptionIdAndParameterId(optionId, request.getParameterId())
                .orElseGet(() -> OptionParameterValue.builder()
                        .option(option)
                        .parameter(parameter)
                        .build());

        val.setStringValue(request.getStringValue());
        val.setNumericValue(request.getNumericValue());
        if (request.getScore() != null) {
            val.setScore(request.getScore());
        }

        OptionParameterValue saved = valueRepository.save(val);
        return convertToValueDto(saved);
    }

    @Transactional
    public List<OptionParameterValueDto> bulkSaveParameterValues(Long decisionId, BulkValueSaveRequest request, User requester) {
        Decision decision = getDecisionOrThrow(decisionId);
        validateOwnerOrAdmin(decision, requester);

        if (request.getValues() == null || request.getValues().isEmpty()) {
            return Collections.emptyList();
        }

        List<OptionParameterValueDto> results = new ArrayList<>();
        for (OptionParameterValueRequest valReq : request.getValues()) {
            if (valReq.getOptionId() != null && valReq.getParameterId() != null) {
                results.add(saveOptionParameterValue(decisionId, valReq.getOptionId(), valReq, requester));
            }
        }
        return results;
    }

    // ==========================================
    // COMPARISON TABLE & SCORING SYSTEM
    // ==========================================

    @Transactional
    public ComparisonTableDto getComparisonTable(Long decisionId) {
        Decision decision = getDecisionOrThrow(decisionId);
        List<ComparisonParameter> parameters = parameterRepository.findByDecisionId(decisionId);
        List<Option> options = optionRepository.findByDecisionId(decisionId);
        List<OptionParameterValue> allValues = valueRepository.findByDecisionId(decisionId);

        // Filter out legacy auto-initialized default parameters if they have no user-entered values
        Set<String> defaultNames = Set.of("cost", "benefits", "risk", "time", "convenience");
        parameters = parameters.stream().filter(param -> {
            boolean isDefaultName = defaultNames.contains(param.getName().toLowerCase());
            boolean hasValue = allValues.stream().anyMatch(v -> 
                v.getParameter().getId().equals(param.getId()) && 
                ((v.getStringValue() != null && !v.getStringValue().trim().isEmpty()) || v.getNumericValue() != null)
            );
            return !isDefaultName || hasValue;
        }).collect(Collectors.toList());

        // Map values by optionId -> parameterId -> OptionParameterValue
        Map<Long, Map<Long, OptionParameterValue>> valueMap = new HashMap<>();
        for (OptionParameterValue val : allValues) {
            valueMap.computeIfAbsent(val.getOption().getId(), k -> new HashMap<>())
                    .put(val.getParameter().getId(), val);
        }

        // Calculate scores for numeric parameter values across options
        Map<Long, Map<Long, Double>> computedScores = calculateNormalizedScores(parameters, options, valueMap);

        List<OptionComparisonDto> optionDtos = new ArrayList<>();

        for (Option option : options) {
            Map<Long, OptionParameterValue> optVals = valueMap.getOrDefault(option.getId(), Collections.emptyMap());
            Map<Long, OptionParameterValueDto> paramValDtoMap = new HashMap<>();
            List<OptionParameterValueDto> paramValDtoList = new ArrayList<>();

            double weightedScoreSum = 0.0;
            double totalWeightSum = 0.0;

            for (ComparisonParameter param : parameters) {
                OptionParameterValue rawVal = optVals.get(param.getId());
                Double score = null;
                if (computedScores.containsKey(option.getId())) {
                    score = computedScores.get(option.getId()).get(param.getId());
                }
                if (score == null && rawVal != null) {
                    score = rawVal.getScore();
                }
                if (score == null) {
                    score = 0.0;
                }

                OptionParameterValueDto vDto = OptionParameterValueDto.builder()
                        .id(rawVal != null ? rawVal.getId() : null)
                        .optionId(option.getId())
                        .parameterId(param.getId())
                        .parameterName(param.getName())
                        .stringValue(rawVal != null ? rawVal.getStringValue() : null)
                        .numericValue(rawVal != null ? rawVal.getNumericValue() : null)
                        .score(score)
                        .updatedAt(rawVal != null ? rawVal.getUpdatedAt() : null)
                        .build();

                paramValDtoMap.put(param.getId(), vDto);
                paramValDtoList.add(vDto);

                weightedScoreSum += score * param.getWeight();
                totalWeightSum += param.getWeight();
            }

            double totalScore = totalWeightSum > 0 ? (weightedScoreSum / totalWeightSum) : 0.0;
            totalScore = Math.round(totalScore * 100.0) / 100.0;

            OptionComparisonDto optionDto = OptionComparisonDto.builder()
                    .optionId(option.getId())
                    .optionTitle(option.getOptionTitle())
                    .description(option.getDescription())
                    .pros(option.getPros())
                    .cons(option.getCons())
                    .parameterValuesMap(paramValDtoMap)
                    .parameterValuesList(paramValDtoList)
                    .totalScore(totalScore)
                    .build();

            optionDtos.add(optionDto);
        }

        // Rank options based on totalScore (descending)
        optionDtos.sort((o1, o2) -> Double.compare(o2.getTotalScore(), o1.getTotalScore()));

        int rank = 1;
        for (OptionComparisonDto optDto : optionDtos) {
            optDto.setRank(rank);

            // Persist totalScore & rank into Option table if option exists
            Option optionEntity = optionRepository.findById(optDto.getOptionId()).orElse(null);
            if (optionEntity != null) {
                optionEntity.setRanking(rank);
                optionRepository.save(optionEntity);
            }
            rank++;
        }

        OptionComparisonDto recommended = !optionDtos.isEmpty() ? optionDtos.get(0) : null;
        String summary = generateAnalyticalSummary(decision, recommended, optionDtos);

        return ComparisonTableDto.builder()
                .decisionId(decision.getId())
                .decisionTitle(decision.getTitle())
                .decisionDescription(decision.getDescription())
                .parameters(parameters.stream().map(this::convertToParameterDto).collect(Collectors.toList()))
                .options(optionDtos)
                .recommendedOption(recommended)
                .analyticalSummary(summary)
                .build();
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private Map<Long, Map<Long, Double>> calculateNormalizedScores(
            List<ComparisonParameter> parameters,
            List<Option> options,
            Map<Long, Map<Long, OptionParameterValue>> valueMap) {

        Map<Long, Map<Long, Double>> scores = new HashMap<>();

        for (ComparisonParameter param : parameters) {
            Double minVal = null;
            Double maxVal = null;

            for (Option opt : options) {
                OptionParameterValue val = valueMap.getOrDefault(opt.getId(), Collections.emptyMap()).get(param.getId());
                if (val != null && val.getNumericValue() != null) {
                    double num = val.getNumericValue();
                    if (minVal == null || num < minVal) minVal = num;
                    if (maxVal == null || num > maxVal) maxVal = num;
                }
            }

            for (Option opt : options) {
                OptionParameterValue val = valueMap.getOrDefault(opt.getId(), Collections.emptyMap()).get(param.getId());
                double score = 50.0; // Default midpoint score

                if (val != null && val.getScore() != null) {
                    score = val.getScore();
                } else if (val != null && val.getNumericValue() != null && minVal != null && maxVal != null) {
                    double num = val.getNumericValue();
                    if (Objects.equals(maxVal, minVal)) {
                        score = 100.0;
                    } else if (param.getHigherIsBetter()) {
                        score = ((num - minVal) / (maxVal - minVal)) * 100.0;
                    } else {
                        score = ((maxVal - num) / (maxVal - minVal)) * 100.0;
                    }
                }

                score = Math.round(score * 100.0) / 100.0;
                scores.computeIfAbsent(opt.getId(), k -> new HashMap<>()).put(param.getId(), score);
            }
        }

        return scores;
    }

    private List<ComparisonParameter> initializeDefaultParameters(Decision decision) {
        String[] defaultNames = {"Cost", "Benefits", "Risk", "Time", "Convenience"};
        boolean[] higherBetter = {false, true, false, false, true};
        List<ComparisonParameter> list = new ArrayList<>();

        for (int i = 0; i < defaultNames.length; i++) {
            ComparisonParameter param = ComparisonParameter.builder()
                    .decision(decision)
                    .name(defaultNames[i])
                    .unit("")
                    .weight(1.0)
                    .higherIsBetter(higherBetter[i])
                    .build();
            list.add(parameterRepository.save(param));
        }
        return list;
    }

    private String generateAnalyticalSummary(Decision decision, OptionComparisonDto topOption, List<OptionComparisonDto> allOptions) {
        if (topOption == null || allOptions.isEmpty()) {
            return "No options available to compare.";
        }
        if (allOptions.size() == 1) {
            return "Only one option '" + topOption.getOptionTitle() + "' is configured for this decision.";
        }

        OptionComparisonDto runnerUp = allOptions.size() > 1 ? allOptions.get(1) : null;
        StringBuilder sb = new StringBuilder();
        sb.append("Based on multi-criteria analysis across evaluated parameters, '")
          .append(topOption.getOptionTitle())
          .append("' is the recommended top option with an overall score of ")
          .append(topOption.getTotalScore())
          .append("/100.");

        if (runnerUp != null) {
            sb.append(" It outperforms '")
              .append(runnerUp.getOptionTitle())
              .append("' (Score: ")
              .append(runnerUp.getTotalScore())
              .append("/100).");
        }
        return sb.toString();
    }

    private Decision getDecisionOrThrow(Long decisionId) {
        return decisionRepository.findById(decisionId)
                .orElseThrow(() -> new ResourceNotFoundException("Decision not found with id: " + decisionId));
    }

    private void validateOwnerOrAdmin(Decision decision, User requester) {
        boolean isOwner = decision.getUser().getId().equals(requester.getId());
        boolean isAdmin = requester.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new UnauthorizedActionException("Only decision owner or admin can modify comparison settings.");
        }
    }

    private ComparisonParameterDto convertToParameterDto(ComparisonParameter param) {
        return ComparisonParameterDto.builder()
                .id(param.getId())
                .decisionId(param.getDecision().getId())
                .name(param.getName())
                .unit(param.getUnit())
                .weight(param.getWeight())
                .higherIsBetter(param.getHigherIsBetter())
                .createdAt(param.getCreatedAt())
                .build();
    }

    private OptionParameterValueDto convertToValueDto(OptionParameterValue val) {
        return OptionParameterValueDto.builder()
                .id(val.getId())
                .optionId(val.getOption().getId())
                .parameterId(val.getParameter().getId())
                .parameterName(val.getParameter().getName())
                .stringValue(val.getStringValue())
                .numericValue(val.getNumericValue())
                .score(val.getScore())
                .updatedAt(val.getUpdatedAt())
                .build();
    }
}
