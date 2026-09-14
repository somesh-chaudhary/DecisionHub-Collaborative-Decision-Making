package com.example.backend.repository;

import com.example.backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
	List<Comment> findByDecisionId(Long decisionId);

    // Fetch all top-level comments for a decision
    List<Comment> findByDecisionIdAndParentCommentIsNullOrderByCreatedAtAsc(Long decisionId);

    // Fetch replies of a comment
    List<Comment> findByParentCommentCommentIdOrderByCreatedAtAsc(Long commentId);

    void deleteByDecisionId(Long decisionId);

    void deleteByUserId(Long userId);

    List<Comment> findByUserId(Long userId);
}