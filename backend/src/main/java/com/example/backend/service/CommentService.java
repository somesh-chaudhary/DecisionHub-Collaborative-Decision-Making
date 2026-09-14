package com.example.backend.service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.CommentDto;
import com.example.backend.dto.CommentRequest;
import com.example.backend.entity.Comment;
import com.example.backend.entity.Community;
import com.example.backend.entity.CommunityMember;
import com.example.backend.entity.Decision;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedActionException;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.CommunityMemberRepository;
import com.example.backend.repository.DecisionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final DecisionRepository decisionRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final NotificationService notificationService;

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
            Optional<CommunityMember> memberOpt = 
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
    public CommentDto createComment(Long decisionId,
                                    CommentRequest request,
                                    User user) {

        Decision decision = decisionRepository.findById(decisionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Decision not found."));

        if (Boolean.TRUE.equals(decision.getIsDiscussionLocked())) {
            if (!canManageModerationControls(decision, user)) {
                throw new UnauthorizedActionException("Discussions are locked for this decision. Only the decision owner and community moderators can post.");
            }
        }

        Comment comment = Comment.builder()
                .decision(decision)
                .user(user)
                .commentText(request.getCommentText())
                .isPinned(false)
                .isHidden(false)
                .parentComment(null)
                .createdAt(java.time.LocalDateTime.now())
                .updatedAt(java.time.LocalDateTime.now())
                .build();

        comment = commentRepository.save(comment);

        notificationService.createCommentNotification(
                decision,
                user,
                comment.getCommentId()
        );

        return convertToDto(comment);
    }
    
    private CommentDto convertToDto(Comment comment) {
        return CommentDto.builder()
                .commentId(comment.getCommentId())
                .userId(comment.getUser().getId())
                .username(comment.getUser().getActualUsername())
                .commentText(comment.getCommentText())
                .isPinned(Boolean.TRUE.equals(comment.getIsPinned()))
                .isHidden(Boolean.TRUE.equals(comment.getIsHidden()))
                .createdAt(comment.getCreatedAt())
                .replies(List.of())
                .build();
    }
    
    private CommentDto convertToDtoWithReplies(Comment comment) {
        List<CommentDto> replies = commentRepository
                .findByParentCommentCommentIdOrderByCreatedAtAsc(comment.getCommentId())
                .stream()
                .map(this::convertToDtoWithReplies)
                .toList();

        return CommentDto.builder()
                .commentId(comment.getCommentId())
                .userId(comment.getUser().getId())
                .username(comment.getUser().getActualUsername())
                .commentText(comment.getCommentText())
                .isPinned(Boolean.TRUE.equals(comment.getIsPinned()))
                .isHidden(Boolean.TRUE.equals(comment.getIsHidden()))
                .createdAt(comment.getCreatedAt())
                .replies(replies)
                .build();
    }
    
    @Transactional
    public CommentDto replyToComment(Long commentId,
                                     CommentRequest request,
                                     User user) {

        Comment parentComment = commentRepository.findById(commentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Comment not found."));

        Decision decision = parentComment.getDecision();
        if (Boolean.TRUE.equals(decision.getIsDiscussionLocked())) {
            if (!canManageModerationControls(decision, user)) {
                throw new UnauthorizedActionException("Discussions are locked for this decision. Only the decision owner and community moderators can post.");
            }
        }

        Comment reply = Comment.builder()
                .decision(decision)
                .user(user)
                .parentComment(parentComment)
                .commentText(request.getCommentText())
                .isPinned(false)
                .isHidden(false)
                .createdAt(java.time.LocalDateTime.now())
                .updatedAt(java.time.LocalDateTime.now())
                .build();

        reply = commentRepository.save(reply);

        notificationService.createReplyNotification(
                parentComment,
                user,
                reply.getCommentId()
        );

        return convertToDto(reply);
    }
    
    @Transactional(readOnly = true)
    public List<CommentDto> getComments(Long decisionId) {

        decisionRepository.findById(decisionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Decision not found."));

        List<Comment> comments = commentRepository
                .findByDecisionIdAndParentCommentIsNullOrderByCreatedAtAsc(decisionId);

        // Sort pinned comments first, then by creation date ascending
        return comments.stream()
                .sorted(Comparator.comparing((Comment c) -> Boolean.TRUE.equals(c.getIsPinned()) ? 0 : 1)
                        .thenComparing(Comment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::convertToDtoWithReplies)
                .toList();
    }

    @Transactional
    public CommentDto togglePinComment(Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Comment not found."));

        Decision decision = comment.getDecision();
        if (!canManageModerationControls(decision, user)) {
            throw new UnauthorizedActionException("Only the decision board owner or community moderators can pin comments.");
        }

        boolean currentPinned = Boolean.TRUE.equals(comment.getIsPinned());
        comment.setIsPinned(!currentPinned);
        comment = commentRepository.save(comment);

        return convertToDtoWithReplies(comment);
    }

    @Transactional
    public CommentDto toggleHideComment(Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Comment not found."));

        Decision decision = comment.getDecision();
        if (!canManageModerationControls(decision, user)) {
            throw new UnauthorizedActionException("Only the decision board owner or community moderators can hide comments.");
        }

        boolean currentHidden = Boolean.TRUE.equals(comment.getIsHidden());
        comment.setIsHidden(!currentHidden);
        comment = commentRepository.save(comment);

        return convertToDtoWithReplies(comment);
    }
    
    @Transactional
    public CommentDto updateComment(Long commentId,
                                    CommentRequest request,
                                    User user) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Comment not found."));

        if (!comment.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedActionException(
                    "You can edit only your own comments.");
        }

        comment.setCommentText(request.getCommentText());
        comment.setUpdatedAt(java.time.LocalDateTime.now());

        comment = commentRepository.save(comment);

        // Notify the decision owner
        notificationService.createCommentEditedNotification(
                comment.getDecision(),
                user,
                comment.getCommentId()
        );

        return convertToDtoWithReplies(comment);
    }
    
    @Transactional
    public void deleteComment(Long commentId, User user) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Comment not found."));

        boolean isAuthor = comment.getUser().getId().equals(user.getId());
        boolean canManage = canManageModerationControls(comment.getDecision(), user) || (user != null && user.getRole() == Role.ADMIN);

        if (!isAuthor && !canManage) {
            throw new UnauthorizedActionException(
                    "You are not authorized to delete this comment.");
        }

        // Notify before deleting
        notificationService.createCommentDeletedNotification(
                comment.getDecision(),
                user,
                comment.getCommentId()
        );

        commentRepository.delete(comment);
    }

}