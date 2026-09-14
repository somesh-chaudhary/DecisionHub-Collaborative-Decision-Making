package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MetricsSummaryDto {
    private long totalUsers;
    private long activeUsers;
    private long suspendedUsers;
    private long totalCommunities;
    private long totalDecisions;
    private long totalVotes;
    private long totalComments;
}
