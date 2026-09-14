package com.example.backend.repository;

import com.example.backend.entity.CommunityMember;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import org.springframework.data.jpa.repository.Query;

public interface CommunityMemberRepository extends JpaRepository<CommunityMember, Long> {

    boolean existsByCommunityIdAndUserId(Long communityId, Long userId);

    @Query("SELECT c FROM CommunityMember c WHERE c.community.id = :communityId AND c.user.id = :userId")
	Optional<CommunityMember> findByCommunityIdAndUserId(Long communityId, Long userId);

    void deleteByCommunityIdAndUserId(Long communityId, Long userId);

    // ADD THIS
    void deleteByCommunityId(Long communityId);
    
    List<CommunityMember> findByCommunityId(Long communityId);

    void deleteByUserId(Long userId);

    List<CommunityMember> findByUserId(Long userId);
}