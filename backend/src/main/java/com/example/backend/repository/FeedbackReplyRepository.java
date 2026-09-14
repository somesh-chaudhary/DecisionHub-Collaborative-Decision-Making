package com.example.backend.repository;

import com.example.backend.entity.FeedbackReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackReplyRepository extends JpaRepository<FeedbackReply, Long> {
    List<FeedbackReply> findByFeedbackIdOrderByCreatedAtAsc(Long feedbackId);
    void deleteByFeedbackId(Long feedbackId);
    void deleteByUserId(Long userId);
    void deleteByFeedbackIdIn(java.util.List<Long> feedbackIds);
}

