package com.example.backend.repository;

import com.example.backend.entity.Report;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatusOrderByCreatedAtDesc(String status);

    List<Report> findByTargetTypeOrderByCreatedAtDesc(String targetType);

    List<Report> findAllByOrderByCreatedAtDesc();

    List<Report> findByCommunityIdOrderByCreatedAtDesc(Long communityId);

    List<Report> findByCommunityIdAndStatusOrderByCreatedAtDesc(Long communityId, String status);

    List<Report> findByCommunityIdAndTargetTypeOrderByCreatedAtDesc(Long communityId, String targetType);

    List<Report> findByCommunityIdAndTargetTypeAndStatusOrderByCreatedAtDesc(Long communityId, String targetType, String status);

    long countByCommunityIdAndStatus(Long communityId, String status);

    long countByCommunityIdAndTargetTypeAndStatus(Long communityId, String targetType, String status);

    long countByStatus(String status);

    @Modifying
    @Query("DELETE FROM Report r WHERE r.reporter = :user OR r.reportedUser = :user OR r.moderator = :user")
    void deleteByUserReference(@Param("user") User user);

    @Modifying
    @Query("UPDATE Report r SET r.decision = null WHERE r.decision.id = :decisionId")
    void clearDecisionReference(@Param("decisionId") Long decisionId);

    @Modifying
    @Query("UPDATE Report r SET r.community = null WHERE r.community.id = :communityId")
    void clearCommunityReference(@Param("communityId") Long communityId);
}
