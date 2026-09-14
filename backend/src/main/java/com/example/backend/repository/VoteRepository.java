package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.Vote;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByDecisionIdAndUserId(Long decisionId, Long userId);
    long countByOptionId(Long optionId);
    void deleteByUserId(Long userId);
    java.util.List<Vote> findByUserId(Long userId);
}
