package com.example.backend.service;

import com.example.backend.dto.OptionDto;
import com.example.backend.dto.OptionRequest;
import com.example.backend.entity.Decision;
import com.example.backend.entity.Option;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedActionException;
import com.example.backend.repository.DecisionRepository;
import com.example.backend.repository.OptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OptionService {

    private final OptionRepository optionRepository;
    private final DecisionRepository decisionRepository;

    // ==========================
    // ADD OPTION
    // ==========================
    @Transactional
    public OptionDto addOption(
            Long decisionId,
            OptionRequest request,
            User requester) {

        Decision decision = decisionRepository.findById(decisionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Decision not found."));

        boolean isOwner = decision.getUser().getId().equals(requester.getId());
        boolean isAdmin = requester.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedActionException(
                    "Only the decision owner or admin can add options.");
        }

        if (request.getOptionTitle() == null ||
                request.getOptionTitle().trim().isEmpty()) {
            throw new BadRequestException("Option title cannot be empty.");
        }

        Option option = new Option();
        option.setDecision(decision);
        option.setOptionTitle(request.getOptionTitle());
        option.setDescription(request.getDescription());
        option.setPros(request.getPros());
        option.setCons(request.getCons());

        Option saved = optionRepository.save(option);

        return convertToDto(saved);
    }

    // ==========================
    // UPDATE OPTION
    // ==========================
    @Transactional
    public OptionDto updateOption(
            Long decisionId,
            Long optionId,
            OptionRequest request,
            User requester) {

        Decision decision = decisionRepository.findById(decisionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Decision not found."));

        Option option = optionRepository.findById(optionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Option not found."));

        if (!option.getDecision().getId().equals(decisionId)) {
            throw new BadRequestException(
                    "This option does not belong to the specified decision.");
        }

        boolean isOwner = decision.getUser().getId().equals(requester.getId());
        boolean isAdmin = requester.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedActionException(
                    "Only the decision owner or admin can update this option.");
        }

        if (request.getOptionTitle() == null ||
                request.getOptionTitle().trim().isEmpty()) {
            throw new BadRequestException("Option title cannot be empty.");
        }

        option.setOptionTitle(request.getOptionTitle());
        option.setDescription(request.getDescription());
        option.setPros(request.getPros());
        option.setCons(request.getCons());

        Option saved = optionRepository.save(option);

        return convertToDto(saved);
    }

    // ==========================
    // COMMON DTO CONVERTER
    // ==========================
    private OptionDto convertToDto(Option option) {

        OptionDto dto = new OptionDto();

        dto.setId(option.getId());
        dto.setDecisionId(option.getDecision().getId());
        dto.setOptionTitle(option.getOptionTitle());
        dto.setDescription(option.getDescription());
        dto.setPros(option.getPros());
        dto.setCons(option.getCons());
        dto.setScore(option.getScore());
        dto.setRanking(option.getRanking());
        dto.setCreatedAt(option.getCreatedAt());

        return dto;
    }
    @Transactional
    public void deleteOption(
            Long decisionId,
            Long optionId,
            User requester) {

        Decision decision = decisionRepository.findById(decisionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Decision not found."));

        Option option = optionRepository.findById(optionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Option not found."));

        // Check if option belongs to this decision
        if (!option.getDecision().getId().equals(decisionId)) {
            throw new BadRequestException(
                    "This option does not belong to the specified decision.");
        }

        // Authorization
        boolean isOwner = decision.getUser().getId().equals(requester.getId());
        boolean isAdmin = requester.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedActionException(
                    "Only the decision owner or admin can delete this option.");
        }

        optionRepository.delete(option);
    }
    @Transactional(readOnly = true)
    public List<OptionDto> getAllOptions(Long decisionId) {

        // Check if decision exists
        decisionRepository.findById(decisionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Decision not found."));

        return optionRepository.findByDecisionId(decisionId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
}