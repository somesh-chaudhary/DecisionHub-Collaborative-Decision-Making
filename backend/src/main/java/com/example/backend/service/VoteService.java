package com.example.backend.service;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.VoteDto;
import com.example.backend.dto.VoteRequest;
import com.example.backend.entity.Decision;
import com.example.backend.entity.Option;
import com.example.backend.entity.User;
import com.example.backend.entity.Vote;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.DecisionRepository;
import com.example.backend.repository.OptionRepository;
import com.example.backend.repository.VoteRepository;
import com.example.backend.service.NotificationService;

import java.util.Optional;

@Service
public class VoteService {

    private final VoteRepository voteRepository;
    private final OptionRepository optionRepository;
    private final DecisionRepository decisionRepository;
    private final NotificationService notificationService;
    

    public VoteService(VoteRepository voteRepository,
            OptionRepository optionRepository,
            DecisionRepository decisionRepository,
            NotificationService notificationService) {

    		this.voteRepository = voteRepository;
    		this.optionRepository = optionRepository;
    		this.decisionRepository = decisionRepository;
    		this.notificationService = notificationService;
}

    @Transactional
    public VoteDto castVote(Long decisionId, VoteRequest request, User user) {
        Decision decision = decisionRepository.findById(decisionId)
                .orElseThrow(() -> new ResourceNotFoundException("Decision not found"));

        if ("CLOSED".equalsIgnoreCase(decision.getStatus())) {
            throw new BadRequestException("This decision board is closed for voting.");
        }

        Option newOption = optionRepository.findById(request.getOptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Option not found"));

        if (!newOption.getDecision().getId().equals(decision.getId())) {
            throw new BadRequestException("Option does not belong to the specified decision");
        }

        Optional<Vote> existingVoteOpt = voteRepository.findByDecisionIdAndUserId(decision.getId(), user.getId());

        if (existingVoteOpt.isPresent()) {
            Vote existingVote = existingVoteOpt.get();
            Option oldOption = existingVote.getOption();

            if (!oldOption.getId().equals(newOption.getId())) {

                // Update vote
                existingVote.setOption(newOption);
                existingVote.setVoteType(request.getVoteType());
                Vote updatedVote = voteRepository.save(existingVote);

                // Recalculate exact vote counts for both options
                oldOption.setScore((int) voteRepository.countByOptionId(oldOption.getId()));
                optionRepository.save(oldOption);
                newOption.setScore((int) voteRepository.countByOptionId(newOption.getId()));
                optionRepository.save(newOption);

                // Notify decision owner
                notificationService.createVoteUpdatedNotification(
                        decision,
                        user,
                        updatedVote.getId()
                );

                return convertToDto(updatedVote);
            } else {
                // Same option, maybe updating voteType
                existingVote.setVoteType(request.getVoteType());
                return convertToDto(voteRepository.save(existingVote));
            }
        } else {
            // New vote
            Vote vote = new Vote();
            vote.setUser(user);
            vote.setDecision(decision);
            vote.setOption(newOption);
            vote.setVoteType(request.getVoteType());
            Vote savedVote = voteRepository.save(vote);

            // Recalculate exact vote count for new option
            newOption.setScore((int) voteRepository.countByOptionId(newOption.getId()));
            optionRepository.save(newOption);

            // Notify the decision owner
            notificationService.createVoteNotification(
                    decision,
                    user,
                    savedVote.getId()
            );

            return convertToDto(savedVote);
        }
    }

    @Transactional
    public void removeVote(Long decisionId, User user) {
        Decision decision = decisionRepository.findById(decisionId)
                .orElseThrow(() -> new ResourceNotFoundException("Decision not found"));

        if ("CLOSED".equalsIgnoreCase(decision.getStatus())) {
            throw new BadRequestException("This decision board is closed for voting.");
        }

        Vote existingVote = voteRepository.findByDecisionIdAndUserId(decision.getId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No vote found to retract for this decision."));

        Option option = existingVote.getOption();
        voteRepository.delete(existingVote);

        if (option != null) {
            option.setScore((int) voteRepository.countByOptionId(option.getId()));
            optionRepository.save(option);
        }

        // Notify decision owner that vote was removed
        notificationService.createVoteRemovedNotification(decision, user);
    }

    private VoteDto convertToDto(Vote vote) {
        VoteDto dto = new VoteDto();
        dto.setId(vote.getId());
        dto.setUserId(vote.getUser().getId());
        dto.setDecisionId(vote.getDecision().getId());
        dto.setOptionId(vote.getOption().getId());
        dto.setVoteType(vote.getVoteType());
        dto.setCreatedAt(vote.getCreatedAt());
        return dto;
    }
}
