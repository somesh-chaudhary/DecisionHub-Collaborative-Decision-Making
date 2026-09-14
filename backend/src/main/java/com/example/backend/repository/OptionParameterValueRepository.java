package com.example.backend.repository;

import com.example.backend.entity.OptionParameterValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OptionParameterValueRepository extends JpaRepository<OptionParameterValue, Long> {

    List<OptionParameterValue> findByOptionId(Long optionId);

    List<OptionParameterValue> findByParameterId(Long parameterId);

    Optional<OptionParameterValue> findByOptionIdAndParameterId(Long optionId, Long parameterId);

    @Query("SELECT v FROM OptionParameterValue v WHERE v.option.decision.id = :decisionId")
    List<OptionParameterValue> findByDecisionId(@Param("decisionId") Long decisionId);
}
