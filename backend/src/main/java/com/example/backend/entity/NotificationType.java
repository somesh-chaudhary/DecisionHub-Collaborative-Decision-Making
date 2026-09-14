package com.example.backend.entity;

public enum NotificationType {

    // Decision Interaction Notifications
    COMMENT,
    REPLY,
    COMMENT_EDIT,
    COMMENT_DELETE,

    VOTE,
    VOTE_UPDATED,
    VOTE_REMOVED,

    // Community Join Request Notifications
    JOIN_REQUEST,
    JOIN_REQUEST_APPROVED,
    JOIN_REQUEST_REJECTED,

    // Community Notifications
    COMMUNITY_UPDATED,
    COMMUNITY_DELETED,
    MEMBER_REMOVED,

    // Decision Notifications
    DECISION_UPDATED,

    // Legacy / Future
    INVITATION,

    // Admin Notifications
    COMMUNITY_CREATED,
    DECISION_CREATED,
    MODERATOR_ACTION,

    // Feedback Notifications
    FEEDBACK_CREATED,
    FEEDBACK_REPLIED,
    FEEDBACK_STATUS_UPDATED,
    FEEDBACK_DELETED,

    // Broadcast / Announcement Notifications
    BROADCAST,
    ANNOUNCEMENT,

    // Moderation Notifications
    WARNING
}