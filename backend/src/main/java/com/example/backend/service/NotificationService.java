package com.example.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.NotificationDto;
import com.example.backend.entity.Comment;
import com.example.backend.entity.Community;
import com.example.backend.entity.Decision;
import com.example.backend.entity.Notification;
import com.example.backend.entity.NotificationType;
import com.example.backend.entity.User;
import com.example.backend.exception.ResourceNotFoundException;
//import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedActionException;
import com.example.backend.entity.CommunityMember;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.CommunityMemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final CommunityMemberRepository communityMemberRepository;
    

    /**
     * Generic notification creator
     */
    public NotificationDto createNotification(
            User receiver,
            User sender,
            NotificationType type,
            String title,
            String message,
            Decision decision,
            Community community,
            Long referenceId) {

        // Don't notify yourself
        if (receiver != null &&
            sender != null &&
            receiver.getId().equals(sender.getId())) {
            return null;
        }

        Notification notification = Notification.builder()
                .receiver(receiver)
                .sender(sender)
                .type(type)
                .title(title)
                .message(message)
                .decision(decision)
                .community(community)
                .referenceId(referenceId)
                .build();

        Notification saved = notificationRepository.save(notification);

        return convertToDto(saved);
    }

    /**
     * Get all notifications
     */
    @Transactional(readOnly = true)
    public List<NotificationDto> getAllNotifications(Long userId) {
        return notificationRepository
                .findByReceiverIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notifications
     */
    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications(Long userId) {
        return notificationRepository
                .findByReceiverIdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Count unread notifications
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByReceiverIdAndReadFalse(userId);
    }

    /**
     * Mark one notification as read
     */
    public void markAsRead(Long notificationId, User user) {

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Notification not found."));

        if (!notification.getReceiver().getId().equals(user.getId())) {
            throw new UnauthorizedActionException(
                    "You cannot modify another user's notification.");
        }

        notification.setRead(true);

        notificationRepository.save(notification);
    }
    /**
     * Mark all notifications as read
     */
    public void markAllAsRead(Long userId) {

        List<Notification> notifications =
                notificationRepository.findByReceiverIdAndReadFalseOrderByCreatedAtDesc(userId);

        notifications.forEach(n -> n.setRead(true));

        notificationRepository.saveAll(notifications);
    }

    /**
     * Delete notification
     */
    public void deleteNotification(Long notificationId, User user) {

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Notification not found."));

        if (!notification.getReceiver().getId().equals(user.getId())) {
            throw new UnauthorizedActionException(
                    "You cannot delete another user's notification.");
        }

        notificationRepository.delete(notification);
    }
    
    
    @Transactional
    public void createCommentNotification(Decision decision,
                                          User commenter,
                                          Long commentId) {

    	User decisionOwner = decision.getUser();

        // Don't notify yourself
        if (decisionOwner.getId().equals(commenter.getId())) {
            return;
        }

        createNotification(
                decisionOwner,
                commenter,
                NotificationType.COMMENT,
                "New Comment",
                commenter.getActualUsername() + " commented on your decision.",
                decision,
                decision.getCommunity(),
                commentId
        );
    }
    
    @Transactional
    public void createCommentEditedNotification(Decision decision,
                                                User editor,
                                                Long commentId) {

        User decisionOwner = decision.getUser();

        // Don't notify yourself
        if (decisionOwner.getId().equals(editor.getId())) {
            return;
        }

        createNotification(
                decisionOwner,
                editor,
                NotificationType.COMMENT_EDIT,
                "Comment Edited",
                editor.getActualUsername() + " edited a comment on your decision.",
                decision,
                decision.getCommunity(),
                commentId
        );
    }
    
    @Transactional
    public void createCommentDeletedNotification(Decision decision,
                                                 User user,
                                                 Long commentId) {
        if (decision == null || decision.getUser() == null || user == null) {
            return;
        }

        User decisionOwner = decision.getUser();

        // Don't notify yourself
        if (decisionOwner.getId().equals(user.getId())) {
            return;
        }

        createNotification(
                decisionOwner,
                user,
                NotificationType.COMMENT_DELETE,
                "Comment Deleted",
                user.getActualUsername() + " deleted a comment on your decision.",
                decision,
                decision.getCommunity(),
                commentId
        );
    }
    
    @Transactional
    public void createReplyNotification(Comment parentComment,
                                        User replier,
                                        Long replyId) {

        User receiver = parentComment.getUser();

        // Don't notify yourself
        if (receiver.getId().equals(replier.getId())) {
            return;
        }

        createNotification(
                receiver,
                replier,
                NotificationType.REPLY,
                "New Reply",
                replier.getActualUsername() + " replied to your comment.",
                parentComment.getDecision(),
                parentComment.getDecision().getCommunity(),
                replyId
        );
    }
    
    @Transactional
    public void createVoteNotification(Decision decision,
                                       User voter,
                                       Long voteId) {

        User decisionOwner = decision.getUser();

        if (decisionOwner.getId().equals(voter.getId())) {
            return;
        }

        createNotification(
                decisionOwner,
                voter,
                NotificationType.VOTE,
                "New Vote",
                voter.getActualUsername() + " voted on your decision.",
                decision,
                decision.getCommunity(),
                voteId
        );
    }
    
    @Transactional
    public void createVoteUpdatedNotification(Decision decision,
                                              User voter,
                                              Long voteId) {

        User decisionOwner = decision.getUser();

        if (decisionOwner.getId().equals(voter.getId())) {
            return;
        }

        createNotification(
                decisionOwner,
                voter,
                NotificationType.VOTE_UPDATED,
                "Vote Updated",
                voter.getActualUsername() + " changed their vote.",
                decision,
                decision.getCommunity(),
                voteId
        );
    }
    
    @Transactional
    public void createVoteRemovedNotification(Decision decision,
                                              User voter) {

        User decisionOwner = decision.getUser();

        if (decisionOwner.getId().equals(voter.getId())) {
            return;
        }

        createNotification(
                decisionOwner,
                voter,
                NotificationType.VOTE_REMOVED,
                "Vote Removed",
                voter.getActualUsername() + " removed their vote.",
                decision,
                decision.getCommunity(),
                null
        );
    }
    
    @Transactional
    public void createJoinRequestNotification(Community community,
                                              User requester,
                                              Long requestId) {

        User moderator = community.getModerator();

        // Don't notify yourself
        if (moderator.getId().equals(requester.getId())) {
            return;
        }

        createNotification(
                moderator,
                requester,
                NotificationType.JOIN_REQUEST,
                "New Join Request",
                requester.getActualUsername() +
                        " requested to join " +
                        community.getName() + ".",
                null,
                community,
                requestId
        );
    }
    
    @Transactional
    public void createJoinRequestApprovedNotification(Community community,
                                                      User user,
                                                      Long requestId) {

        createNotification(
                user,
                community.getModerator(),
                NotificationType.JOIN_REQUEST_APPROVED,
                "Request Approved",
                "Your request to join " +
                        community.getName() +
                        " was approved.",
                null,
                community,
                requestId
        );
    }
    
    @Transactional
    public void createJoinRequestRejectedNotification(Community community,
                                                      User user,
                                                      Long requestId) {

        createNotification(
                user,
                community.getModerator(),
                NotificationType.JOIN_REQUEST_REJECTED,
                "Request Rejected",
                "Your request to join " +
                        community.getName() +
                        " was rejected.",
                null,
                community,
                requestId
        );
    }
    
    @Transactional
    public void createMemberRemovedNotification(Community community,
                                                User removedUser,
                                                User removedBy) {

        // If user removed themselves, don't notify
        if (removedUser.getId().equals(removedBy.getId())) {
            return;
        }

        createNotification(
                removedUser,
                removedBy,
                NotificationType.MEMBER_REMOVED,
                "Removed from Community",
                "You have been removed from " +
                        community.getName() + ".",
                null,
                community,
                null
        );
    }
    
    @Transactional
    public void createCommunityUpdatedNotification(
            Community community,
            User receiver,
            User updatedBy) {

        // Don't notify the user who performed the update
        if (receiver.getId().equals(updatedBy.getId())) {
            return;
        }

        createNotification(
                receiver,
                updatedBy,
                NotificationType.COMMUNITY_UPDATED,
                "Community Updated",
                community.getName() + " has been updated.",
                null,
                community,
                null
        );
    }
    
    @Transactional
    public void createDecisionUpdatedNotification(Decision decision,
                                                  User receiver,
                                                  User updatedBy) {

        // Don't notify the updater
        if (receiver.getId().equals(updatedBy.getId())) {
            return;
        }

        createNotification(
                receiver,
                updatedBy,
                NotificationType.DECISION_UPDATED,
                "Decision Updated",
                decision.getTitle() + " has been updated.",
                decision,
                decision.getCommunity(),
                decision.getId()
        );
    }
    
    @Transactional
    public void createCommunityDeletedNotification(Community community,
                                                   User receiver,
                                                   User deletedBy) {

        // Don't notify the user who deleted the community
        if (receiver.getId().equals(deletedBy.getId())) {
            return;
        }

        createNotification(
                receiver,
                deletedBy,
                NotificationType.COMMUNITY_DELETED,
                "Community Deleted",
                community.getName() + " has been deleted.",
                null,
                null,
                null
        );
    }
    
    @Transactional
    public void createCommunityCreatedNotification(Community community,
                                                   User admin,
                                                   User creator) {

        if (admin.getId().equals(creator.getId())) {
            return;
        }

        createNotification(
                admin,
                creator,
                NotificationType.COMMUNITY_CREATED,
                "New Community Created",
                community.getName() + " was created by "
                        + creator.getActualUsername() + ".",
                null,
                community,
                community.getId()
        );
    }
    @Transactional
    public void createDecisionCreatedNotification(Decision decision,
                                                  User admin,
                                                  User creator) {

        if (admin.getId().equals(creator.getId())) {
            return;
        }

        createNotification(
                admin,
                creator,
                NotificationType.DECISION_CREATED,
                "New Decision Created",
                decision.getTitle() + " was created by "
                        + creator.getActualUsername() + ".",
                decision,
                decision.getCommunity(),
                decision.getId()
        );
    }
    
    @Transactional
    public void createFeedbackCreatedNotification(User admin,
                                                  User sender,
                                                  Long feedbackId) {

        if (admin.getId().equals(sender.getId())) {
            return;
        }

        createNotification(
                admin,
                sender,
                NotificationType.FEEDBACK_CREATED,
                "New Feedback Received",
                sender.getActualUsername() + " submitted new feedback.",
                null,
                null,
                feedbackId
        );
    }

    @Transactional
    public void createReportNotification(User admin,
                                          User reporter,
                                          String targetType,
                                          String targetTitle,
                                          Long reportId) {
        if (admin.getId().equals(reporter.getId())) {
            return;
        }

        createNotification(
                admin,
                reporter,
                NotificationType.MODERATOR_ACTION,
                "New Content Report",
                reporter.getActualUsername() + " reported a " + targetType + " ('" + targetTitle + "').",
                null,
                null,
                reportId
        );
    }
    
    @Transactional
    public void createFeedbackRepliedNotification(User receiver,
                                                  User admin,
                                                  Long feedbackId) {

        createNotification(
                receiver,
                admin,
                NotificationType.FEEDBACK_REPLIED,
                "Feedback Replied",
                "An administrator replied to your feedback.",
                null,
                null,
                feedbackId
        );
    }
    
    @Transactional
    public void createFeedbackStatusUpdatedNotification(User receiver,
                                                        User admin,
                                                        String status,
                                                        Long feedbackId) {

        createNotification(
                receiver,
                admin,
                NotificationType.FEEDBACK_STATUS_UPDATED,
                "Feedback Status Updated",
                "Your feedback status was updated to " + status + ".",
                null,
                null,
                feedbackId
        );
    }
    
    @Transactional
    public void createFeedbackDeletedNotification(User receiver,
                                                  User sender,
                                                  Long feedbackId,
                                                  boolean deletedByAdmin) {

        String message = deletedByAdmin
                ? "Your feedback has been deleted by an administrator."
                : sender.getActualUsername() + " deleted their feedback.";

        createNotification(
                receiver,
                sender,
                NotificationType.FEEDBACK_DELETED,
                "Feedback Deleted",
                message,
                null,
                null,
                feedbackId
        );
    }
    

    /**
     * Entity → DTO
     */
    private NotificationDto convertToDto(Notification notification) {

        return NotificationDto.builder()
                .id(notification.getId())

                .senderId(notification.getSender() != null
                        ? notification.getSender().getId()
                        : null)

                .senderUsername(notification.getSender() != null
                        ? notification.getSender().getUsername()
                        : "System")

                .type(notification.getType())

                .title(notification.getTitle())

                .message(notification.getMessage())

                .decisionId(notification.getDecision() != null
                        ? notification.getDecision().getId()
                        : null)

                .communityId(notification.getCommunity() != null
                        ? notification.getCommunity().getId()
                        : null)

                .referenceId(notification.getReferenceId())

                .read(notification.isRead())

                .createdAt(notification.getCreatedAt())

                .build();
    }

    public int broadcastAnnouncement(String title, String message, String target, User sender) {
        List<User> recipients;
        if (target == null || target.equalsIgnoreCase("All Users") || target.trim().isEmpty()) {
            recipients = userRepository.findAll();
        } else {
            List<CommunityMember> members;
            try {
                Long communityId = Long.parseLong(target);
                members = communityMemberRepository.findByCommunityId(communityId);
            } catch (NumberFormatException e) {
                members = communityMemberRepository.findAll().stream()
                        .filter(cm -> cm.getCommunity() != null && cm.getCommunity().getName().equalsIgnoreCase(target))
                        .collect(Collectors.toList());
            }
            recipients = members.stream().map(CommunityMember::getUser).collect(Collectors.toList());
        }

        int count = 0;
        for (User receiver : recipients) {
            createNotification(
                    receiver,
                    sender,
                    NotificationType.BROADCAST,
                    title,
                    message,
                    null,
                    null,
                    null
            );
            count++;
        }
        return count;
    }
}