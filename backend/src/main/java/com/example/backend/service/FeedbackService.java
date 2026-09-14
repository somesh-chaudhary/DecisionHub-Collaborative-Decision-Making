package com.example.backend.service;

import com.example.backend.dto.FeedbackDto;
import com.example.backend.dto.FeedbackReplyRequest;
import com.example.backend.dto.FeedbackRequest;
import com.example.backend.entity.Feedback;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedActionException;
import com.example.backend.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Transactional
    public FeedbackDto createFeedback(FeedbackRequest request, User user) {
        String cat = request.getCategory() != null ? request.getCategory() : "General";
        String initialStatus = "Bug".equalsIgnoreCase(cat) ? "NEW" : null;

        Feedback feedback = Feedback.builder()
                .user(user)
                .rating(request.getRating() != null ? request.getRating() : 5)
                .category(cat)
                .comment(request.getComment())
                .status(initialStatus)
                .build();

        feedback = feedbackRepository.save(feedback);

     // Notify all admins
     List<User> admins = userRepository.findByRole(Role.ADMIN);

     for (User admin : admins) {
         notificationService.createFeedbackCreatedNotification(
                 admin,
                 user,
                 feedback.getId()
         );
     }

     return convertToDto(feedback);
    }

    @Transactional(readOnly = true)
    public List<FeedbackDto> getFeedbacks(User user) {
        List<Feedback> list;
        if (user.getRole() == Role.ADMIN) {
            list = feedbackRepository.findAllByOrderByCreatedAtDesc().stream()
                    .filter(f -> !Boolean.TRUE.equals(f.getIsDeleted()))
                    .toList();
        } else {
            list = feedbackRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                    .filter(f -> !Boolean.TRUE.equals(f.getIsDeleted()))
                    .toList();
        }
        return list.stream().map(this::convertToDto).toList();
    }

    @Transactional
    public FeedbackDto replyToFeedback(Long id, FeedbackReplyRequest request, User admin) {
        if (admin.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("Only administrators can reply to feedback.");
        }

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found."));

        feedback.setAdminReply(request.getAdminReply());
        feedback.setAdminRepliedAt(LocalDateTime.now());

        feedback = feedbackRepository.save(feedback);

     // Notify the feedback owner
     notificationService.createFeedbackRepliedNotification(
             feedback.getUser(),
             admin,
             feedback.getId()
     );

     return convertToDto(feedback);
    }

    @Transactional
    public FeedbackDto deleteReply(Long id, User admin) {
        if (admin.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("Only administrators can delete feedback replies.");
        }

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found."));

        feedback.setAdminReply(null);
        feedback.setAdminRepliedAt(null);

        feedback = feedbackRepository.save(feedback);
        return convertToDto(feedback);
    }

    @Transactional
    public void deleteFeedback(Long id, User user) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found."));

        boolean isOwner = feedback.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedActionException("You are not authorized to delete this feedback.");
        }

//        boolean isAdmin = user.getRole() == Role.ADMIN;

     // Notify before marking as deleted
     if (isAdmin) {

         // Admin deleted -> notify feedback owner
         notificationService.createFeedbackDeletedNotification(
                 feedback.getUser(),
                 user,
                 feedback.getId(),
                 true
         );

     } else {

         // User deleted -> notify all admins
         List<User> admins = userRepository.findByRole(Role.ADMIN);

         for (User admin : admins) {
             notificationService.createFeedbackDeletedNotification(
                     admin,
                     user,
                     feedback.getId(),
                     false
             );
         }
     }

     feedback.setIsDeleted(true);
     feedbackRepository.save(feedback);
    }

    @Transactional
    public FeedbackDto updateFeedbackStatus(Long id, Map<String, String> payload, User admin) {
        if (admin.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("Only administrators can update feedback status.");
        }

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found."));

        String newStatus = payload.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            throw new BadRequestException("Status is required.");
        }

        feedback.setStatus(newStatus.trim().toUpperCase());
        feedback = feedbackRepository.save(feedback);

        // Notify the feedback owner
        notificationService.createFeedbackStatusUpdatedNotification(
                feedback.getUser(),
                admin,
                feedback.getStatus(),
                feedback.getId()
        );

        return convertToDto(feedback);
    }

    private FeedbackDto convertToDto(Feedback feedback) {
        return FeedbackDto.builder()
                .id(feedback.getId())
                .userId(feedback.getUser().getId())
                .username(feedback.getUser().getActualUsername())
                .rating(feedback.getRating())
                .category(feedback.getCategory())
                .comment(feedback.getComment())
                .status(feedback.getStatus())
                .adminReply(feedback.getAdminReply())
                .adminRepliedAt(feedback.getAdminRepliedAt())
                .isDeleted(feedback.getIsDeleted())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }
}
