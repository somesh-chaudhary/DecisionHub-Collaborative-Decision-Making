//package com.example.backend.repository;
//
//import com.example.backend.entity.CommunityJoinRequest;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.stereotype.Repository;
//
//import java.util.List;
//import java.util.Optional;
//
//@Repository
//public interface CommunityJoinRequestRepository extends JpaRepository<CommunityJoinRequest, Long> {
//    
//    List<CommunityJoinRequest> findByCommunityIdAndStatus(Long communityId, String status);
//    
//    Optional<CommunityJoinRequest> findByCommunityIdAndUserIdAndStatus(Long communityId, Long userId, String status);
//    
//    boolean existsByCommunityIdAndUserIdAndStatus(Long communityId, Long userId, String status);
//    
//    
//}


package com.example.backend.repository;

import com.example.backend.entity.CommunityJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommunityJoinRequestRepository extends JpaRepository<CommunityJoinRequest, Long> {

    List<CommunityJoinRequest> findByCommunityIdAndStatus(Long communityId, String status);

    Optional<CommunityJoinRequest> findByCommunityIdAndUserIdAndStatus(Long communityId,
                                                                       Long userId,
                                                                       String status);

    boolean existsByCommunityIdAndUserIdAndStatus(Long communityId,
                                                  Long userId,
                                                  String status);

    // ADD THIS
    void deleteByCommunityId(Long communityId);

    void deleteByUserId(Long userId);

    List<CommunityJoinRequest> findByUserId(Long userId);
}
