package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "moderation_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType; // BOARD, POLL, USER, COMMENT, COMMUNITY

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "target_title", length = 255)
    private String targetTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id")
    private Community community;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decision_id")
    private Decision decision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    @Column(nullable = false, length = 100)
    private String reason; // Spam, Harassment, Misinformation, Hate Speech, Inappropriate, Other

    @Column(columnDefinition = "TEXT")
    private String details;

    @Builder.Default
    @Column(length = 30, nullable = false)
    private String status = "PENDING"; // PENDING, REVIEWED, DISMISSED, ACTION_TAKEN

    @Builder.Default
    @Column(name = "action_taken", length = 50)
    private String actionTaken = "NONE"; // NONE, WARNED, CONTENT_DELETED, USER_SUSPENDED, USER_BANNED, DISMISSED

    @Column(name = "moderator_notes", columnDefinition = "TEXT")
    private String moderatorNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderator_id")
    private User moderator;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING";
        if (this.actionTaken == null) this.actionTaken = "NONE";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
