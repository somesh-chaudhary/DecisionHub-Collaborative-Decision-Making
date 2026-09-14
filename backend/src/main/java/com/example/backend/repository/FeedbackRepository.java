package com.example.backend.repository;

import com.example.backend.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Feedback> findByUserId(Long userId);
    List<Feedback> findAllByOrderByCreatedAtDesc();
    void deleteByUserId(Long userId);
}

