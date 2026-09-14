package com.example.backend.repository;

import com.example.backend.entity.Community;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityRepository extends JpaRepository<Community, Long> {
    boolean existsByName(String name);
    List<Community> findByModeratorId(Long moderatorId);
}
