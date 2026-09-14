package com.example.backend.service;

import com.example.backend.dto.ModerationActionRequestDto;
import com.example.backend.dto.ReportRequestDto;
import com.example.backend.dto.ReportResponseDto;
import com.example.backend.entity.*;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ModerationService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final DecisionRepository decisionRepository;
    private final CommentRepository commentRepository;
    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final DecisionService decisionService;
    private final UserService userService;
    private final CommunityService communityService;
    private final CommentService commentService;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    public ReportResponseDto createReport(ReportRequestDto request, User reporter) {
        String cleanType = request.getTargetType().toUpperCase().trim();
        String title = request.getTargetTitle();
        User reportedUser = null;
        Community community = null;
        Decision decision = null;

        if (request.getReportedUserId() != null) {
            reportedUser = userRepository.findById(request.getReportedUserId()).orElse(null);
        }

        if (request.getTargetId() != null) {
            if ("BOARD".equals(cleanType) || "DECISION".equals(cleanType) || "POLL".equals(cleanType)) {
                Decision d = decisionRepository.findById(request.getTargetId()).orElse(null);
                if (d != null) {
                    decision = d;
                    if (title == null || title.isBlank()) title = d.getTitle();
                    if (reportedUser == null) reportedUser = d.getUser();
                }
            } else if ("COMMENT".equals(cleanType)) {
                Comment c = commentRepository.findById(request.getTargetId()).orElse(null);
                if (c != null) {
                    if (title == null || title.isBlank()) {
                        title = c.getCommentText() != null && c.getCommentText().length() > 60
                                ? c.getCommentText().substring(0, 60) + "…"
                                : c.getCommentText();
                    }
                    if (reportedUser == null) reportedUser = c.getUser();
                    decision = c.getDecision();
                    if (decision != null && decision.getCommunity() != null) {
                        community = decision.getCommunity();
                    }
                }
            } else if ("COMMUNITY".equals(cleanType)) {
                Community com = communityRepository.findById(request.getTargetId()).orElse(null);
                if (com != null) {
                    community = com;
                    if (title == null || title.isBlank()) title = com.getName();
                    if (reportedUser == null) reportedUser = com.getModerator();
                }
            } else if ("USER".equals(cleanType)) {
                User u = userRepository.findById(request.getTargetId()).orElse(null);
                if (u != null) {
                    if (title == null || title.isBlank()) title = u.getActualUsername();
                    reportedUser = u;
                }
            }
        }

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(cleanType)
                .targetId(request.getTargetId())
                .targetTitle(title != null ? title : "Reported Item #" + request.getTargetId())
                .reportedUser(reportedUser)
                .community(community)
                .decision(decision)
                .reason(request.getReason())
                .details(request.getDetails())
                .status("PENDING")
                .actionTaken("NONE")
                .build();

        Report saved = reportRepository.save(report);

        // Dispatch notification to all System Admins
        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createReportNotification(
                        admin,
                        reporter,
                        saved.getTargetType(),
                        saved.getTargetTitle(),
                        saved.getId()
                );
            }
        } catch (Exception e) {
            System.err.println("Failed to dispatch report notification to admins: " + e.getMessage());
        }

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getReports(String status, String type) {
        List<Report> reports = reportRepository.findAllByOrderByCreatedAtDesc();

        return reports.stream()
                .filter(r -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                        return status.equalsIgnoreCase(r.getStatus());
                    }
                    return true;
                })
                .filter(r -> {
                    if (type != null && !type.isBlank() && !"ALL".equalsIgnoreCase(type)) {
                        return type.equalsIgnoreCase(r.getTargetType());
                    }
                    return true;
                })
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReportResponseDto getReportById(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
        return mapToDto(report);
    }

    public ReportResponseDto dismissReport(Long id, User moderator, String notes) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));

        report.setStatus("DISMISSED");
        report.setActionTaken("DISMISSED");
        report.setModerator(moderator);
        report.setModeratorNotes(notes);
        report.setResolvedAt(LocalDateTime.now());

        Report saved = reportRepository.save(report);
        return mapToDto(saved);
    }

    public ReportResponseDto executeAction(Long id, ModerationActionRequestDto request, User moderator) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));

        String action = request.getAction() != null ? request.getAction().toUpperCase().trim() : "NONE";

        switch (action) {
            case "DISMISS":
                report.setStatus("DISMISSED");
                report.setActionTaken("DISMISSED");
                break;

            case "WARN":
                User targetUser = resolveReportedUser(report);
                if (targetUser == null) {
                    throw new BadRequestException("Cannot issue warning: Author or reported user could not be found for this item.");
                }
                report.setReportedUser(targetUser);

                Decision decisionRef = null;
                Community communityRef = null;
                String typeLabel = "Content";

                String cleanType = report.getTargetType() != null ? report.getTargetType().toUpperCase().trim() : "";
                if ("BOARD".equals(cleanType) || "DECISION".equals(cleanType) || "POLL".equals(cleanType)) {
                    typeLabel = "Decision Board";
                    if (report.getTargetId() != null) {
                        decisionRef = decisionRepository.findById(report.getTargetId()).orElse(null);
                        if (decisionRef != null) {
                            communityRef = decisionRef.getCommunity();
                        }
                    }
                } else if ("COMMENT".equals(cleanType)) {
                    typeLabel = "Comment";
                    if (report.getTargetId() != null) {
                        Comment comment = commentRepository.findById(report.getTargetId()).orElse(null);
                        if (comment != null) {
                            decisionRef = comment.getDecision();
                            if (decisionRef != null) {
                                communityRef = decisionRef.getCommunity();
                            }
                        }
                    }
                } else if ("COMMUNITY".equals(cleanType)) {
                    typeLabel = "Community";
                    if (report.getTargetId() != null) {
                        communityRef = communityRepository.findById(report.getTargetId()).orElse(null);
                    }
                } else if ("USER".equals(cleanType)) {
                    typeLabel = "User Profile";
                }

                String reasonStr = (report.getReason() != null && !report.getReason().isBlank())
                        ? report.getReason().trim()
                        : "Violation of Community Guidelines";

                String targetTitle = (report.getTargetTitle() != null && !report.getTargetTitle().isBlank())
                        ? report.getTargetTitle().trim()
                        : "Item #" + report.getTargetId();

                StringBuilder msgBuilder = new StringBuilder();
                msgBuilder.append("Your ").append(typeLabel).append(" ('").append(targetTitle).append("') was reported for: ")
                          .append(reasonStr).append(".");

                if (report.getDetails() != null && !report.getDetails().isBlank()) {
                    msgBuilder.append("\nReport Details: ").append(report.getDetails().trim());
                }

                String directive = null;
                if (request.getWarningMessage() != null && !request.getWarningMessage().isBlank()) {
                    directive = request.getWarningMessage().trim();
                } else if (request.getModeratorNotes() != null && !request.getModeratorNotes().isBlank()) {
                    directive = request.getModeratorNotes().trim();
                }

                if (directive != null && !directive.isBlank()) {
                    msgBuilder.append("\nModerator Directive: ").append(directive);
                } else {
                    msgBuilder.append("\nPlease review the community guidelines and ensure future posts adhere to platform rules.");
                }

                String fullMsg = msgBuilder.toString();
                String notifTitle = "Moderation Warning: " + reasonStr;
                if (notifTitle.length() > 95) {
                    notifTitle = notifTitle.substring(0, 92) + "...";
                }

                Notification notification = Notification.builder()
                        .receiver(targetUser)
                        .sender(moderator)
                        .type(NotificationType.WARNING)
                        .title(notifTitle)
                        .message(fullMsg)
                        .decision(decisionRef)
                        .community(communityRef)
                        .referenceId(report.getTargetId())
                        .read(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notification);

                report.setStatus("ACTION_TAKEN");
                report.setActionTaken("WARNED");
                break;

            case "DELETE":
            case "DELETE_CONTENT":
            case "DELETE_COMMENT":
            case "DELETE_BOARD":
                if (report.getTargetId() != null) {
                    String type = report.getTargetType() != null ? report.getTargetType().toUpperCase() : "";
                    if ("BOARD".equals(type) || "DECISION".equals(type) || "POLL".equals(type)) {
                        report.setDecision(null);
                        try {
                            decisionService.deleteDecision(report.getTargetId(), moderator);
                        } catch (Exception ignored) {}
                    } else if ("COMMENT".equals(type)) {
                        try {
                            commentService.deleteComment(report.getTargetId(), moderator);
                        } catch (Exception e) {
                            try {
                                commentRepository.deleteById(report.getTargetId());
                            } catch (Exception ignored) {}
                        }
                    } else if ("COMMUNITY".equals(type)) {
                        report.setCommunity(null);
                        try {
                            communityService.deleteCommunity(report.getTargetId(), moderator);
                        } catch (Exception ignored) {}
                    }
                }
                report.setStatus("ACTION_TAKEN");
                report.setActionTaken("CONTENT_DELETED");
                break;

            case "SUSPEND":
            case "SUSPEND_USER":
                User suspendUser = resolveReportedUser(report);
                if (suspendUser == null) {
                    throw new BadRequestException("Cannot suspend user: User associated with this report could not be found.");
                }
                report.setReportedUser(suspendUser);
                userService.updateUserStatus(suspendUser.getId(), "SUSPENDED");
                report.setStatus("ACTION_TAKEN");
                report.setActionTaken("USER_SUSPENDED");
                break;

            case "BAN":
            case "BAN_USER":
                User banUser = resolveReportedUser(report);
                if (banUser == null) {
                    throw new BadRequestException("Cannot ban user: User associated with this report could not be found.");
                }
                report.setReportedUser(banUser);
                userService.updateUserStatus(banUser.getId(), "BANNED");
                report.setStatus("ACTION_TAKEN");
                report.setActionTaken("USER_BANNED");
                break;

            default:
                throw new BadRequestException("Unknown moderation action: " + action);
        }

        report.setModerator(moderator);
        report.setModeratorNotes(request.getModeratorNotes());
        report.setResolvedAt(LocalDateTime.now());

        Report saved = reportRepository.save(report);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getCommunityReports(Long communityId, User user, String status) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new ResourceNotFoundException("Community not found with id: " + communityId));

        if (!isCommunityModeratorOrAdmin(community, user)) {
            throw new BadRequestException("Only community moderators or administrators can view community reports.");
        }

        List<Report> reports;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            reports = reportRepository.findByCommunityIdAndTargetTypeAndStatusOrderByCreatedAtDesc(communityId, "COMMENT", status.toUpperCase().trim());
        } else {
            reports = reportRepository.findByCommunityIdAndTargetTypeOrderByCreatedAtDesc(communityId, "COMMENT");
        }

        return reports.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public ReportResponseDto dismissCommunityReport(Long communityId, Long reportId, User moderator, String notes) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new ResourceNotFoundException("Community not found with id: " + communityId));

        if (!isCommunityModeratorOrAdmin(community, moderator)) {
            throw new BadRequestException("Only community moderators or administrators can dismiss reports in this community.");
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        if (report.getCommunity() == null || !report.getCommunity().getId().equals(communityId)) {
            throw new BadRequestException("This report does not belong to the specified community.");
        }

        report.setStatus("DISMISSED");
        report.setActionTaken("DISMISSED");
        report.setModerator(moderator);
        report.setModeratorNotes(notes);
        report.setResolvedAt(LocalDateTime.now());

        Report saved = reportRepository.save(report);
        return mapToDto(saved);
    }

    public ReportResponseDto executeCommunityAction(Long communityId, Long reportId, ModerationActionRequestDto request, User moderator) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new ResourceNotFoundException("Community not found with id: " + communityId));

        if (!isCommunityModeratorOrAdmin(community, moderator)) {
            throw new BadRequestException("Only community moderators or administrators can take moderation actions in this community.");
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        if (report.getCommunity() == null || !report.getCommunity().getId().equals(communityId)) {
            throw new BadRequestException("This report does not belong to the specified community.");
        }

        String action = request.getAction() != null ? request.getAction().toUpperCase().trim() : "NONE";

        switch (action) {
            case "DISMISS":
                report.setStatus("DISMISSED");
                report.setActionTaken("DISMISSED");
                break;

            case "WARN":
                User targetUser = resolveReportedUser(report);
                if (targetUser == null) {
                    throw new BadRequestException("Cannot issue warning: Author or reported user could not be found.");
                }
                report.setReportedUser(targetUser);

                String reasonStr = (report.getReason() != null && !report.getReason().isBlank()) ? report.getReason().trim() : "Community Guideline Violation";
                String targetTitle = (report.getTargetTitle() != null && !report.getTargetTitle().isBlank()) ? report.getTargetTitle().trim() : "Item #" + report.getTargetId();

                StringBuilder msgBuilder = new StringBuilder();
                msgBuilder.append("Community Warning: Your content ('").append(targetTitle).append("') in '")
                          .append(community.getName()).append("' was reported for: ").append(reasonStr).append(".");

                if (report.getDetails() != null && !report.getDetails().isBlank()) {
                    msgBuilder.append("\nReport Details: ").append(report.getDetails().trim());
                }

                String directive = request.getWarningMessage() != null && !request.getWarningMessage().isBlank()
                        ? request.getWarningMessage().trim()
                        : (request.getModeratorNotes() != null && !request.getModeratorNotes().isBlank() ? request.getModeratorNotes().trim() : null);

                if (directive != null) {
                    msgBuilder.append("\nModerator Directive: ").append(directive);
                } else {
                    msgBuilder.append("\nPlease review ").append(community.getName()).append(" guidelines and adhere to community rules.");
                }

                Notification notification = Notification.builder()
                        .receiver(targetUser)
                        .sender(moderator)
                        .type(NotificationType.WARNING)
                        .title("Warning from " + community.getName() + " Moderator")
                        .message(msgBuilder.toString())
                        .decision(report.getDecision())
                        .community(community)
                        .referenceId(report.getTargetId())
                        .read(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notification);

                report.setStatus("ACTION_TAKEN");
                report.setActionTaken("WARNED");
                break;

            case "HIDE":
            case "HIDE_COMMENT":
                if ("COMMENT".equalsIgnoreCase(report.getTargetType()) && report.getTargetId() != null) {
                    Comment comment = commentRepository.findById(report.getTargetId()).orElse(null);
                    if (comment != null) {
                        comment.setIsHidden(true);
                        commentRepository.save(comment);
                    }
                }
                report.setStatus("ACTION_TAKEN");
                report.setActionTaken("COMMENT_HIDDEN");
                break;

            case "UNHIDE":
            case "UNHIDE_COMMENT":
                if ("COMMENT".equalsIgnoreCase(report.getTargetType()) && report.getTargetId() != null) {
                    Comment comment = commentRepository.findById(report.getTargetId()).orElse(null);
                    if (comment != null) {
                        comment.setIsHidden(false);
                        commentRepository.save(comment);
                    }
                }
                report.setStatus("ACTION_TAKEN");
                report.setActionTaken("COMMENT_UNHIDDEN");
                break;

            case "DELETE":
            case "DELETE_CONTENT":
            case "DELETE_COMMENT":
                if (report.getTargetId() != null) {
                    String type = report.getTargetType() != null ? report.getTargetType().toUpperCase() : "";
                    if ("COMMENT".equals(type)) {
                        try {
                            commentService.deleteComment(report.getTargetId(), moderator);
                        } catch (Exception e) {
                            try {
                                commentRepository.deleteById(report.getTargetId());
                            } catch (Exception ignored) {}
                        }
                    } else if ("BOARD".equals(type) || "DECISION".equals(type) || "POLL".equals(type)) {
                        try { decisionService.deleteDecision(report.getTargetId(), moderator); } catch (Exception ignored) {}
                    }
                }
                report.setStatus("ACTION_TAKEN");
                report.setActionTaken("CONTENT_DELETED");
                break;

            case "KICK":
            case "KICK_MEMBER":
            case "REMOVE_MEMBER":
                User memberToRemove = resolveReportedUser(report);
                if (memberToRemove != null) {
                    try {
                        communityMemberRepository.deleteByCommunityIdAndUserId(communityId, memberToRemove.getId());
                    } catch (Exception ignored) {}
                }
                report.setStatus("ACTION_TAKEN");
                report.setActionTaken("MEMBER_REMOVED");
                break;

            default:
                throw new BadRequestException("Unknown community moderation action: " + action);
        }

        report.setModerator(moderator);
        report.setModeratorNotes(request.getModeratorNotes());
        report.setResolvedAt(LocalDateTime.now());

        Report saved = reportRepository.save(report);
        return mapToDto(saved);
    }

    private boolean isCommunityModeratorOrAdmin(Community community, User user) {
        if (user == null || community == null) return false;
        if (user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().name())) return true;
        return community.getModerator() != null && community.getModerator().getId().equals(user.getId());
    }

    private User resolveReportedUser(Report report) {
        if (report.getReportedUser() != null) {
            return report.getReportedUser();
        }
        if (report.getTargetId() == null) {
            return null;
        }
        String cleanType = report.getTargetType() != null ? report.getTargetType().toUpperCase().trim() : "";
        if ("BOARD".equals(cleanType) || "DECISION".equals(cleanType) || "POLL".equals(cleanType)) {
            return decisionRepository.findById(report.getTargetId()).map(Decision::getUser).orElse(null);
        } else if ("COMMENT".equals(cleanType)) {
            return commentRepository.findById(report.getTargetId()).map(Comment::getUser).orElse(null);
        } else if ("COMMUNITY".equals(cleanType)) {
            return communityRepository.findById(report.getTargetId()).map(Community::getModerator).orElse(null);
        } else if ("USER".equals(cleanType)) {
            return userRepository.findById(report.getTargetId()).orElse(null);
        }
        return null;
    }

    private ReportResponseDto mapToDto(Report r) {
        Long decId = r.getDecision() != null ? r.getDecision().getId() : null;
        String decTitle = r.getDecision() != null ? r.getDecision().getTitle() : null;
        Long commId = r.getCommunity() != null ? r.getCommunity().getId() : null;
        String commName = r.getCommunity() != null ? r.getCommunity().getName() : null;

        String type = r.getTargetType() != null ? r.getTargetType().toUpperCase().trim() : "";
        if (decId == null && r.getTargetId() != null) {
            if ("COMMENT".equals(type)) {
                Comment c = commentRepository.findById(r.getTargetId()).orElse(null);
                if (c != null && c.getDecision() != null) {
                    decId = c.getDecision().getId();
                    decTitle = c.getDecision().getTitle();
                    if (commId == null && c.getDecision().getCommunity() != null) {
                        commId = c.getDecision().getCommunity().getId();
                        commName = c.getDecision().getCommunity().getName();
                    }
                }
            } else if ("BOARD".equals(type) || "DECISION".equals(type) || "POLL".equals(type)) {
                decId = r.getTargetId();
                if (decTitle == null) {
                    Decision d = decisionRepository.findById(r.getTargetId()).orElse(null);
                    if (d != null) decTitle = d.getTitle();
                }
            }
        }

        User reportedUser = r.getReportedUser();
        if (reportedUser == null) {
            reportedUser = resolveReportedUser(r);
        }

        return ReportResponseDto.builder()
                .id(r.getId())
                .targetType(r.getTargetType())
                .targetId(r.getTargetId())
                .targetTitle(r.getTargetTitle())
                .communityId(commId)
                .communityName(commName)
                .decisionId(decId)
                .decisionTitle(decTitle)
                .reporterId(r.getReporter() != null ? r.getReporter().getId() : null)
                .reporterUsername(r.getReporter() != null ? r.getReporter().getActualUsername() : null)
                .reporterEmail(r.getReporter() != null ? r.getReporter().getEmail() : null)
                .reportedUserId(reportedUser != null ? reportedUser.getId() : null)
                .reportedUsername(reportedUser != null ? reportedUser.getActualUsername() : null)
                .reportedEmail(reportedUser != null ? reportedUser.getEmail() : null)
                .reason(r.getReason())
                .details(r.getDetails())
                .status(r.getStatus())
                .actionTaken(r.getActionTaken())
                .moderatorNotes(r.getModeratorNotes())
                .moderatorId(r.getModerator() != null ? r.getModerator().getId() : null)
                .moderatorUsername(r.getModerator() != null ? r.getModerator().getActualUsername() : null)
                .createdAt(r.getCreatedAt())
                .resolvedAt(r.getResolvedAt())
                .build();
    }
}
