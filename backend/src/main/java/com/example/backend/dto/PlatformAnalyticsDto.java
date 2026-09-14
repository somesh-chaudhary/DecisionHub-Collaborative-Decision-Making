package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PlatformAnalyticsDto {
    private long totalUsers;
    private long activeUsers;
    private long totalDecisions;
    private long activeDecisions;
    private long resolvedDecisions;
    private long totalVotes;
    private long totalCommunities;
    private long totalComments;
    private double resolutionRate;
    private double engagementRate;

    private List<TimeSeriesDataPointDto> userGrowth;
    private List<TimeSeriesDataPointDto> votingTrends;
    private List<TopBoardDto> topBoards;
    private List<TopCommunityDto> topCommunities;
    private List<CategoryDistributionDto> categoryDistribution;
    private List<ResolutionStateDto> resolutionStates;
    private List<Map<String, Object>> categoryTrends;

    // Moderation & Platform Safety Telemetry
    private long totalReports;
    private long pendingReports;
    private long resolvedReports;
    private long dismissedReports;
    private long warningsIssued;
    private List<Map<String, Object>> violationBreakdown;
}
