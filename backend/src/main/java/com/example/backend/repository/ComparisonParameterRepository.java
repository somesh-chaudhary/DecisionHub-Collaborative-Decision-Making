package com.example.backend.repository;

import com.example.backend.entity.ComparisonParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComparisonParameterRepository extends JpaRepository<ComparisonParameter, Long> {
    List<ComparisonParameter> findByDecisionId(Long decisionId);
}
