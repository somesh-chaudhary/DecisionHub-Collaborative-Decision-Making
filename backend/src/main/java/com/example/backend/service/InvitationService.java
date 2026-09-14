package com.example.backend.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.backend.dto.*;
import com.example.backend.entity.*;
import com.example.backend.exception.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InvitationService {
    private final DecisionInvitationRepository invitationRepository;
    private final DecisionRepository decisionRepository;
    private final UserRepository userRepository;
//    private final NotificationService notificationService;

    @Transactional
    public InvitationDto invite(Long decisionId, InvitationRequest request, User inviter) {
        Decision decision = decisionRepository.findById(decisionId)
                .orElseThrow(() -> new ResourceNotFoundException("Decision not found."));
        if (!decision.getUser().getId().equals(inviter.getId()))
            throw new UnauthorizedActionException("Only the decision owner can send invitations.");
        User invitee = userRepository.findByEmail(request.getInviteeEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Invitee user not found."));
        if (invitee.getId().equals(inviter.getId()))
            throw new BadRequestException("You cannot invite yourself.");
        if (invitationRepository.existsByDecisionIdAndInviteeId(decisionId, invitee.getId()))
            throw new ResourceAlreadyExistsException("Invitation already sent to this user.");

        DecisionInvitation saved = invitationRepository.save(DecisionInvitation.builder()
                .decision(decision).inviter(inviter).invitee(invitee).status("PENDING").build());
//        notificationService.createInvitationNotification(decision, inviter, invitee, saved.getId());
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<InvitationDto> myInvitations(User user) {
        return invitationRepository.findByInviteeIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public InvitationDto updateStatus(Long invitationId, String status, User user) {
        DecisionInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found."));
        if (!invitation.getInvitee().getId().equals(user.getId()))
            throw new UnauthorizedActionException("Only the invited user can update this invitation.");
        String value = status == null ? "" : status.toUpperCase();
        if (!value.equals("ACCEPTED") && !value.equals("DECLINED"))
            throw new BadRequestException("Status must be ACCEPTED or DECLINED.");
        invitation.setStatus(value);
        return toDto(invitationRepository.save(invitation));
    }

    private InvitationDto toDto(DecisionInvitation i) {
        return InvitationDto.builder().id(i.getId()).decisionId(i.getDecision().getId())
                .decisionTitle(i.getDecision().getTitle()).inviterId(i.getInviter().getId())
                .inviterUsername(i.getInviter().getActualUsername()).inviteeId(i.getInvitee().getId())
                .inviteeUsername(i.getInvitee().getActualUsername()).status(i.getStatus())
                .createdAt(i.getCreatedAt()).build();
    }
}
