package com.example.backend.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.DecisionDto;
import com.example.backend.dto.DecisionRequest;
import com.example.backend.dto.OptionDto;
import com.example.backend.dto.OptionRequest;
import com.example.backend.entity.Comment;
import com.example.backend.entity.Community;
import com.example.backend.entity.Decision;
import com.example.backend.entity.Option;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.entity.Vote;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedActionException;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.CommunityMemberRepository;
import com.example.backend.repository.CommunityRepository;
import com.example.backend.repository.DecisionInvitationRepository;
import com.example.backend.repository.DecisionRepository;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.ReportRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VoteRepository;

@Service
public class DecisionService {

    private final DecisionRepository decisionRepository;
    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final VoteRepository voteRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final DecisionInvitationRepository invitationRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;

    public DecisionService(DecisionRepository decisionRepository,
            CommunityRepository communityRepository,
            CommunityMemberRepository communityMemberRepository,
            VoteRepository voteRepository,
            CommentRepository commentRepository,
            NotificationService notificationService,
            UserRepository userRepository,
            DecisionInvitationRepository invitationRepository,
            NotificationRepository notificationRepository,
            ReportRepository reportRepository)  {
    	this.userRepository = userRepository;
        this.decisionRepository = decisionRepository;
        this.communityRepository = communityRepository;
        this.communityMemberRepository = communityMemberRepository;
        this.voteRepository = voteRepository;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
        this.invitationRepository = invitationRepository;
        this.notificationRepository = notificationRepository;
        this.reportRepository = reportRepository;
    }

    @Transactional
    public DecisionDto createDecision(
            DecisionRequest request,
            User user) {

        Decision decision = new Decision();

        decision.setUser(user);
        decision.setTitle(request.getTitle());
        decision.setDescription(request.getDescription());
        decision.setCategory(request.getCategory());

        if (request.getCommunityId() != null) {
            Community community = communityRepository.findById(request.getCommunityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Community not found."));

            boolean isModerator = community.getModerator().getId().equals(user.getId());
            boolean isMember = communityMemberRepository.existsByCommunityIdAndUserId(community.getId(), user.getId());
            if (!isModerator && !isMember && user.getRole() != Role.ADMIN) {
                throw new UnauthorizedActionException("Only members of the community can create a decision for this community.");
            }
            decision.setCommunity(community);
        }

        List<Option> options = new ArrayList<>();
        if (request.getOptions() != null) {
            for (OptionRequest optReq : request.getOptions()) {
                Option option = new Option();
                option.setDecision(decision);
                option.setOptionTitle(optReq.getOptionTitle());
                option.setDescription(optReq.getDescription());
                option.setPros(optReq.getPros());
                option.setCons(optReq.getCons());
                options.add(option);
            }
        }
        decision.setOptions(options);

        Decision saved = decisionRepository.save(decision);

     // Notify all admins
     List<User> admins = userRepository.findByRole(Role.ADMIN);

     for (User admin : admins) {
         notificationService.createDecisionCreatedNotification(
                 saved,
                 admin,
                 user
         );
     }

     return convertToDto(saved, user);
    }

    @Transactional(readOnly = true)
    public List<DecisionDto> getAllDecisions(User requester) {
        return decisionRepository.findAll().stream()
                .filter(decision -> hasAccess(decision, requester))
                .map(decision -> convertToDto(decision, requester))
                .collect(Collectors.toList());
    }

    private boolean hasAccess(Decision decision, User user) {
        if (decision.getCommunity() == null) return true;
        if (user.getRole() == Role.ADMIN) return true;
        return communityMemberRepository.existsByCommunityIdAndUserId(decision.getCommunity().getId(), user.getId());
    }

    @Transactional(readOnly = true)
    public Decision getDecisionEntityById(Long id) {
        return decisionRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Decision not found!"));
    }

    @Transactional(readOnly = true)
    public DecisionDto getDecisionById(Long id, User requester) {
        Decision decision = getDecisionEntityById(id);
        if (!hasAccess(decision, requester)) {
            throw new UnauthorizedActionException("You do not have access to view this decision.");
        }
        return convertToDto(decision, requester);
    }

    @Transactional
    public DecisionDto updateDecision(
            Long id,
            DecisionRequest request,
            User requester) {

        Decision decision = getDecisionEntityById(id);

        boolean isOwner =
                decision.getUser().getId()
                        .equals(requester.getId());

        boolean isAdmin =
                requester.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedActionException(
                    "Only the decision owner or admin can update this decision.");
        }

        decision.setTitle(request.getTitle());
        decision.setDescription(request.getDescription());
        decision.setCategory(request.getCategory());

        Decision saved = decisionRepository.save(decision);

        /*
         * Notify all users who interacted with this decision.
         * (Vote / Comment / Reply)
         */
        Set<User> participants = new HashSet<>();

        // Add all voters
        for (Vote vote : saved.getVotes()) {
            participants.add(vote.getUser());
        }

        // Add all commenters (includes replies because replies are also comments)
        List<Comment> comments =
                commentRepository.findByDecisionId(saved.getId());

        for (Comment comment : comments) {
            participants.add(comment.getUser());
        }

        // Send notification
        for (User participant : participants) {
            notificationService.createDecisionUpdatedNotification(
                    saved,
                    participant,
                    requester
            );
        }

        return convertToDto(saved, requester);
    }

    @Transactional
    public void deleteDecision(
            Long id,
            User requester) {

        Decision decision = getDecisionEntityById(id);

        boolean isOwner =
                decision.getUser().getId()
                        .equals(requester.getId());

        boolean isAdmin =
                requester.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedActionException(
                    "Only the decision owner or admin can delete this decision.");
        }

        if (decision.getVotes() != null && !decision.getVotes().isEmpty()) {
            voteRepository.deleteAll(decision.getVotes());
            decision.getVotes().clear();
        }

        // Delete invitations linked to decision
        invitationRepository.deleteByDecisionId(id);

        // Delete comments linked to decision
        commentRepository.deleteByDecisionId(id);

        // Clear decision references in notifications
        notificationRepository.clearDecisionReference(id);

        // Clear decision references in moderation reports
        reportRepository.clearDecisionReference(id);

        decisionRepository.delete(decision);
    }

    @Transactional
    public DecisionDto updateDecisionStatus(
            Long id,
            Map<String, String> payload,
            User requester) {

        Decision decision = getDecisionEntityById(id);

        boolean isOwner =
                decision.getUser().getId()
                        .equals(requester.getId());

        boolean isAdmin =
                requester.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedActionException(
                    "Only the decision owner or admin can update decision board status.");
        }

        String newStatus = payload.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new BadRequestException("Status is required.");
        }

        decision.setStatus(newStatus.trim().toUpperCase());
        Decision saved = decisionRepository.save(decision);

        return convertToDto(saved, requester);
    }

    @Transactional(readOnly = true)
    public long countDecisions() {
        return decisionRepository.count();
    }

    public boolean canManageModerationControls(Decision decision, User user) {
        if (user == null || decision == null) return false;
        
        // 1. Decision Board Owner
        if (decision.getUser() != null && decision.getUser().getId().equals(user.getId())) {
            return true;
        }
        
        // 2. Community Moderator (if decision belongs to a community)
        if (decision.getCommunity() != null) {
            Community community = decision.getCommunity();
            if (community.getModerator() != null && community.getModerator().getId().equals(user.getId())) {
                return true;
            }
            Optional<com.example.backend.entity.CommunityMember> memberOpt = 
                    communityMemberRepository.findByCommunityIdAndUserId(community.getId(), user.getId());
            if (memberOpt.isPresent() && "MODERATOR".equalsIgnoreCase(memberOpt.get().getMemberRole())) {
                return true;
            }
        }
        
        return false;
    }

    public boolean isModeratorOrAdmin(Decision decision, User user) {
        return canManageModerationControls(decision, user);
    }

    public boolean isModeratorOrOwnerOrAdmin(Decision decision, User user) {
        return canManageModerationControls(decision, user);
    }

    @Transactional
    public DecisionDto toggleLockDiscussion(Long id, User requester) {
        Decision decision = getDecisionEntityById(id);

        if (!canManageModerationControls(decision, requester)) {
            throw new UnauthorizedActionException("Only the decision board owner or community moderators can lock or unlock discussions.");
        }

        boolean currentStatus = Boolean.TRUE.equals(decision.getIsDiscussionLocked());
        decision.setIsDiscussionLocked(!currentStatus);
        Decision saved = decisionRepository.save(decision);

        return convertToDto(saved, requester);
    }

    private DecisionDto convertToDto(Decision decision, User requester) {
        DecisionDto dto = new DecisionDto();
        dto.setId(decision.getId());
        dto.setUserId(decision.getUser().getId());
        dto.setTitle(decision.getTitle());
        dto.setDescription(decision.getDescription());
        dto.setCategory(decision.getCategory());
        
        if (requester != null) {
            Optional<Vote> voteOpt = voteRepository.findByDecisionIdAndUserId(decision.getId(), requester.getId());
            if (voteOpt.isPresent()) {
                dto.setVotedOptionId(voteOpt.get().getOption().getId());
            }
        }
        
        if (decision.getCommunity() != null) {
            dto.setCommunityId(decision.getCommunity().getId());
            dto.setCommunityName(decision.getCommunity().getName());
        }
        
        dto.setStatus(decision.getStatus());
        dto.setVisibility(decision.getVisibility());
        dto.setIsDiscussionLocked(decision.getIsDiscussionLocked());
        dto.setCreatedAt(decision.getCreatedAt());
        dto.setUpdatedAt(decision.getUpdatedAt());

        if (decision.getOptions() != null) {
            dto.setOptions(decision.getOptions().stream().map(opt -> {
                OptionDto optDto = new OptionDto();
                optDto.setId(opt.getId());
                optDto.setDecisionId(decision.getId());
                optDto.setOptionTitle(opt.getOptionTitle());
                optDto.setDescription(opt.getDescription());
                optDto.setPros(opt.getPros());
                optDto.setCons(opt.getCons());
                long dynamicScore = voteRepository.countByOptionId(opt.getId());
                optDto.setScore((int) dynamicScore);
                optDto.setRanking(opt.getRanking());
                optDto.setCreatedAt(opt.getCreatedAt());
                return optDto;
            }).collect(Collectors.toList()));
        } else {
            dto.setOptions(new ArrayList<>());
        }

        return dto;
    }
}