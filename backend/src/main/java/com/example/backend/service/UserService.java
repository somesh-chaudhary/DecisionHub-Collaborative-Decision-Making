package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.UserDto;
import com.example.backend.entity.Community;
import com.example.backend.entity.Decision;
import com.example.backend.entity.Feedback;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.EmailAlreadyExistsException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.exception.UnauthorizedActionException;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.CommunityJoinRequestRepository;
import com.example.backend.repository.CommunityMemberRepository;
import com.example.backend.repository.CommunityRepository;
import com.example.backend.repository.DecisionInvitationRepository;
import com.example.backend.repository.DecisionRepository;
import com.example.backend.repository.FeedbackReplyRepository;
import com.example.backend.repository.FeedbackRepository;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VoteRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CommunityService communityService;
    private final DecisionService decisionService;
    private final DecisionRepository decisionRepository;
    private final CommunityRepository communityRepository;
    private final VoteRepository voteRepository;
    private final CommentRepository commentRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final CommunityJoinRequestRepository communityJoinRequestRepository;
    private final DecisionInvitationRepository decisionInvitationRepository;
    private final NotificationRepository notificationRepository;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackReplyRepository feedbackReplyRepository;
    private final com.example.backend.repository.ReportRepository reportRepository;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       @Lazy CommunityService communityService,
                       @Lazy DecisionService decisionService,
                       DecisionRepository decisionRepository,
                       CommunityRepository communityRepository,
                       VoteRepository voteRepository,
                       CommentRepository commentRepository,
                       CommunityMemberRepository communityMemberRepository,
                       CommunityJoinRequestRepository communityJoinRequestRepository,
                       DecisionInvitationRepository decisionInvitationRepository,
                       NotificationRepository notificationRepository,
                       FeedbackRepository feedbackRepository,
                       FeedbackReplyRepository feedbackReplyRepository,
                       com.example.backend.repository.ReportRepository reportRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.communityService = communityService;
        this.decisionService = decisionService;
        this.decisionRepository = decisionRepository;
        this.communityRepository = communityRepository;
        this.voteRepository = voteRepository;
        this.commentRepository = commentRepository;
        this.communityMemberRepository = communityMemberRepository;
        this.communityJoinRequestRepository = communityJoinRequestRepository;
        this.decisionInvitationRepository = decisionInvitationRepository;
        this.notificationRepository = notificationRepository;
        this.feedbackRepository = feedbackRepository;
        this.feedbackReplyRepository = feedbackReplyRepository;
        this.reportRepository = reportRepository;
    }

    public AuthResponse registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }

    public AuthResponse loginUser(LoginRequest request) {
        // This throws BadCredentialsException if credentials are invalid
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        String token = jwtService.generateToken(user);
        return new AuthResponse(token);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getActualUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .role(user.getRole())
                .status(user.getStatus())
                .interests(user.getInterests())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    @Transactional
    public UserDto updateUserRole(Long id, String roleStr) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (roleStr != null && !roleStr.trim().isEmpty()) {
            try {
                user.setRole(Role.valueOf(roleStr.trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role: " + roleStr + ". Valid roles are USER, ADMIN.");
            }
        } else {
            user.setRole(user.getRole() == Role.ADMIN ? Role.USER : Role.ADMIN);
        }

        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        return convertToDto(saved);
    }

    @Transactional
    public UserDto updateUserStatus(Long id, String statusStr) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (statusStr != null && !statusStr.trim().isEmpty()) {
            String cleanStatus = statusStr.trim().toUpperCase();
            if (!cleanStatus.equals("ACTIVE") && !cleanStatus.equals("SUSPENDED") && !cleanStatus.equals("BANNED")) {
                throw new BadRequestException("Invalid status: " + statusStr + ". Valid statuses are ACTIVE, SUSPENDED, BANNED.");
            }
            user.setStatus(cleanStatus);
        } else {
            String currentStatus = user.getStatus();
            user.setStatus("ACTIVE".equalsIgnoreCase(currentStatus) ? "SUSPENDED" : "ACTIVE");
        }

        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        return convertToDto(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        deleteUser(id, null);
    }

    @Transactional
    public void deleteUser(Long id, User requester) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (requester != null && requester.getRole() != Role.ADMIN && !requester.getId().equals(id)) {
            throw new UnauthorizedActionException("Only admins or the user themselves can delete this account.");
        }

        User actingUser = (requester != null) ? requester : user;

        // 1. Delete all communities where this user is moderator
        List<Community> moderatedCommunities = communityRepository.findByModeratorId(id);
        for (Community community : moderatedCommunities) {
            communityService.deleteCommunity(community.getId(), actingUser);
        }

        // 2. Delete all decisions created by this user
        List<Decision> userDecisions = decisionRepository.findByUserId(id);
        for (Decision decision : userDecisions) {
            decisionService.deleteDecision(decision.getId(), actingUser);
        }

        // 3. Delete community memberships & join requests
        communityMemberRepository.deleteByUserId(id);
        communityJoinRequestRepository.deleteByUserId(id);

        // 4. Delete decision invitations
        decisionInvitationRepository.deleteByInviterId(id);
        decisionInvitationRepository.deleteByInviteeId(id);

        // 5. Delete votes & comments
        voteRepository.deleteByUserId(id);
        commentRepository.deleteByUserId(id);

        // 6. Delete feedbacks and feedback replies
        feedbackReplyRepository.deleteByUserId(id);
        List<Feedback> userFeedbacks = feedbackRepository.findByUserId(id);
        for (Feedback fb : userFeedbacks) {
            feedbackReplyRepository.deleteByFeedbackId(fb.getId());
        }
        feedbackRepository.deleteByUserId(id);

        // 7. Clean up notifications & reports
        notificationRepository.deleteByReceiverId(id);
        notificationRepository.clearSenderReference(id);
        reportRepository.deleteByUserReference(user);

        // 8. Delete user
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public long countUsers() {
        return userRepository.count();
    }

    @Transactional(readOnly = true)
    public long countActiveUsers() {
        return userRepository.countByStatus("ACTIVE");
    }

    @Transactional(readOnly = true)
    public long countSuspendedUsers() {
        return userRepository.countByStatus("SUSPENDED");
    }

    @Transactional
    public UserDto updateProfile(User user, com.example.backend.dto.UpdateProfileRequest request) {
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getInterests() != null) {
            user.setInterests(request.getInterests().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank() && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail().trim())) {
                throw new EmailAlreadyExistsException("Email is already registered by another account.");
            }
            user.setEmail(request.getEmail().trim());
        }

        User updated = userRepository.save(user);
        return convertToDto(updated);
    }

    @Transactional
    public void changePassword(User user, com.example.backend.dto.ChangePasswordRequest request) {
        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new BadRequestException("Current password is required.");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters.");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deactivateUser(User user) {
        user.setStatus("INACTIVE");
        userRepository.save(user);
    }

    @Transactional
    public void resetPassword(com.example.backend.dto.ResetPasswordRequest request) {
        if (request.getUsernameOrEmail() == null || request.getUsernameOrEmail().isBlank()) {
            throw new BadRequestException("Username or email is required.");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters.");
        }

        String input = request.getUsernameOrEmail().trim();
        User user = userRepository.findByUsername(input)
                .orElseGet(() -> userRepository.findByEmail(input)
                        .orElseThrow(() -> new ResourceNotFoundException("User account not found with username or email: " + input)));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}