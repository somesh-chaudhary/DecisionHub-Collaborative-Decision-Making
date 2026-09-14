package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.Community;
import com.example.backend.entity.Decision;
import com.example.backend.entity.User;
import com.example.backend.entity.Vote;
import com.example.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final UserRepository userRepository;
    private final DecisionRepository decisionRepository;
    private final CommunityRepository communityRepository;
    private final VoteRepository voteRepository;
    private final CommentRepository commentRepository;
    private final ReportRepository reportRepository;

    public AnalyticsService(UserRepository userRepository,
                            DecisionRepository decisionRepository,
                            CommunityRepository communityRepository,
                            VoteRepository voteRepository,
                            CommentRepository commentRepository,
                            ReportRepository reportRepository) {
        this.userRepository = userRepository;
        this.decisionRepository = decisionRepository;
        this.communityRepository = communityRepository;
        this.voteRepository = voteRepository;
        this.commentRepository = commentRepository;
        this.reportRepository = reportRepository;
    }

    public PlatformAnalyticsDto getPlatformAnalytics(String period) {
        String cleanPeriod = (period != null) ? period.toLowerCase().trim() : "monthly";

        List<User> allUsers = userRepository.findAll();
        List<Decision> allDecisions = decisionRepository.findAll();
        List<Community> allCommunities = communityRepository.findAll();
        List<Vote> allVotes = voteRepository.findAll();

        long totalUsers = allUsers.size();
        long activeUsers = allUsers.stream().filter(u -> !"SUSPENDED".equalsIgnoreCase(u.getStatus()) && !"BANNED".equalsIgnoreCase(u.getStatus())).count();
        long totalDecisions = allDecisions.size();
        long resolvedDecisions = allDecisions.stream().filter(d -> "RESOLVED".equalsIgnoreCase(d.getStatus())).count();
        long activeDecisions = allDecisions.stream().filter(d -> "ACTIVE".equalsIgnoreCase(d.getStatus()) || "OPEN".equalsIgnoreCase(d.getStatus())).count();
        long totalVotes = allVotes.size();
        long totalCommunities = allCommunities.size();
        long totalComments = commentRepository.count();

        double resolutionRate = totalDecisions > 0 ? Math.round(((double) resolvedDecisions / totalDecisions) * 1000.0) / 10.0 : 0.0;
        double engagementRate = totalDecisions > 0 ? Math.round(((double) (totalVotes + totalComments) / totalDecisions) * 10.0) / 10.0 : 0.0;

        List<TimeSeriesDataPointDto> userGrowth = generateUserGrowth(allUsers, cleanPeriod);
        List<TimeSeriesDataPointDto> votingTrends = generateVotingTrends(allVotes, cleanPeriod);
        List<TopBoardDto> topBoards = generateTopBoards(allDecisions);
        List<TopCommunityDto> topCommunities = generateTopCommunities(allCommunities, allDecisions);
        List<CategoryDistributionDto> categoryDistribution = generateCategoryDistribution(allDecisions);
        List<ResolutionStateDto> resolutionStates = generateResolutionStates(allDecisions);
        List<Map<String, Object>> categoryTrends = generateCategoryMonthlyTrends(allDecisions);

        List<com.example.backend.entity.Report> allReports = reportRepository.findAll();
        long totalReports = allReports.size();
        long pendingReports = allReports.stream().filter(r -> "PENDING".equalsIgnoreCase(r.getStatus())).count();
        long resolvedReports = allReports.stream().filter(r -> "RESOLVED".equalsIgnoreCase(r.getStatus()) || "ACTION_TAKEN".equalsIgnoreCase(r.getStatus())).count();
        long dismissedReports = allReports.stream().filter(r -> "DISMISSED".equalsIgnoreCase(r.getStatus())).count();
        long warningsIssued = allReports.stream().filter(r -> "WARNED".equalsIgnoreCase(r.getActionTaken())).count();

        Map<String, Long> reasonCounts = allReports.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getReason() != null ? r.getReason().trim() : "Other Violation",
                        Collectors.counting()
                ));

        List<Map<String, Object>> violationBreakdown = new ArrayList<>();
        reasonCounts.forEach((reason, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("reason", reason);
            item.put("count", count);
            double pct = totalReports > 0 ? Math.round(((double) count / totalReports) * 1000.0) / 10.0 : 0.0;
            item.put("percentage", pct);
            violationBreakdown.add(item);
        });

        return PlatformAnalyticsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalDecisions(totalDecisions)
                .activeDecisions(activeDecisions)
                .resolvedDecisions(resolvedDecisions)
                .totalVotes(totalVotes)
                .totalCommunities(totalCommunities)
                .totalComments(totalComments)
                .resolutionRate(resolutionRate)
                .engagementRate(engagementRate)
                .userGrowth(userGrowth)
                .votingTrends(votingTrends)
                .topBoards(topBoards)
                .topCommunities(topCommunities)
                .categoryDistribution(categoryDistribution)
                .resolutionStates(resolutionStates)
                .categoryTrends(categoryTrends)
                .totalReports(totalReports)
                .pendingReports(pendingReports)
                .resolvedReports(resolvedReports)
                .dismissedReports(dismissedReports)
                .warningsIssued(warningsIssued)
                .violationBreakdown(violationBreakdown)
                .build();
    }

    private List<TimeSeriesDataPointDto> generateUserGrowth(List<User> users, String period) {
        List<TimeSeriesDataPointDto> result = new ArrayList<>();
        LocalDate now = LocalDate.now();

        if ("daily".equals(period)) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE (MM/dd)");
            for (int i = 6; i >= 0; i--) {
                LocalDate date = now.minusDays(i);
                long count = users.stream().filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().toLocalDate().isAfter(date)).count();
                // Ensure natural baseline if database was initialized all at once
                result.add(new TimeSeriesDataPointDto(date.format(formatter), count, null));
            }
        } else if ("weekly".equals(period)) {
            for (int i = 5; i >= 0; i--) {
                LocalDate weekEnd = now.minusWeeks(i);
                long count = users.stream().filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().toLocalDate().isAfter(weekEnd)).count();
                result.add(new TimeSeriesDataPointDto("W" + (6 - i), count, null));
            }
        } else {
            // monthly (Last 7 months)
            String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
            int currentMonthIndex = now.getMonthValue() - 1;
            for (int i = 6; i >= 0; i--) {
                int monthIdx = (currentMonthIndex - i + 12) % 12;
                int targetMonthValue = monthIdx + 1;
                long count = users.stream().filter(u -> u.getCreatedAt() != null && (u.getCreatedAt().getMonthValue() <= targetMonthValue || u.getCreatedAt().getYear() < now.getYear())).count();
                result.add(new TimeSeriesDataPointDto(months[monthIdx], count, null));
            }
        }
        return result;
    }

    private List<TimeSeriesDataPointDto> generateVotingTrends(List<Vote> votes, String period) {
        List<TimeSeriesDataPointDto> result = new ArrayList<>();
        LocalDate now = LocalDate.now();

        if ("daily".equals(period)) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE");
            for (int i = 6; i >= 0; i--) {
                LocalDate date = now.minusDays(i);
                long count = votes.stream().filter(v -> v.getCreatedAt() != null && v.getCreatedAt().toLocalDate().isEqual(date)).count();
                result.add(new TimeSeriesDataPointDto(date.format(formatter), count, null));
            }
        } else if ("weekly".equals(period)) {
            for (int i = 5; i >= 0; i--) {
                LocalDate weekStart = now.minusWeeks(i + 1);
                LocalDate weekEnd = now.minusWeeks(i);
                long count = votes.stream().filter(v -> v.getCreatedAt() != null && v.getCreatedAt().toLocalDate().isAfter(weekStart) && !v.getCreatedAt().toLocalDate().isAfter(weekEnd)).count();
                result.add(new TimeSeriesDataPointDto("W" + (6 - i), count, null));
            }
        } else {
            // monthly
            String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
            int currentMonthIndex = now.getMonthValue() - 1;
            for (int i = 5; i >= 0; i--) {
                int monthIdx = (currentMonthIndex - i + 12) % 12;
                int targetMonthValue = monthIdx + 1;
                long count = votes.stream().filter(v -> v.getCreatedAt() != null && v.getCreatedAt().getMonthValue() == targetMonthValue).count();
                result.add(new TimeSeriesDataPointDto(months[monthIdx], count, null));
            }
        }
        return result;
    }

    private List<TopBoardDto> generateTopBoards(List<Decision> decisions) {
        return decisions.stream()
                .map(d -> {
                    long voteCount = (d.getVotes() != null) ? d.getVotes().size() : 0;
                    long commentCount = (d.getId() != null) ? commentRepository.findByDecisionId(d.getId()).size() : 0;
                    String commName = (d.getCommunity() != null) ? d.getCommunity().getName() : "Global";
                    return TopBoardDto.builder()
                            .id(d.getId())
                            .name(d.getTitle())
                            .votes(voteCount)
                            .comments(commentCount)
                            .category(d.getCategory() != null ? d.getCategory() : "General")
                            .communityName(commName)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getVotes() + b.getComments(), a.getVotes() + a.getComments()))
                .limit(5)
                .collect(Collectors.toList());
    }

    private List<TopCommunityDto> generateTopCommunities(List<Community> communities, List<Decision> decisions) {
        return communities.stream()
                .map(c -> {
                    long decisionCount = decisions.stream().filter(d -> d.getCommunity() != null && d.getCommunity().getId().equals(c.getId())).count();
                    long memberCount = c.getMemberCount() != null ? c.getMemberCount() : 1;
                    return TopCommunityDto.builder()
                            .id(c.getId())
                            .name(c.getName())
                            .value(memberCount + (decisionCount * 5))
                            .memberCount(memberCount)
                            .decisionCount(decisionCount)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .collect(Collectors.toList());
    }

    private List<CategoryDistributionDto> generateCategoryDistribution(List<Decision> decisions) {
        if (decisions.isEmpty()) {
            return List.of(
                    new CategoryDistributionDto("Technology", 0, 0),
                    new CategoryDistributionDto("Career", 0, 0),
                    new CategoryDistributionDto("Finance", 0, 0),
                    new CategoryDistributionDto("Lifestyle", 0, 0)
            );
        }

        Map<String, Long> categoryCounts = decisions.stream()
                .collect(Collectors.groupingBy(
                        d -> (d.getCategory() != null && !d.getCategory().isBlank()) ? d.getCategory() : "General",
                        Collectors.counting()
                ));

        long total = decisions.size();
        return categoryCounts.entrySet().stream()
                .map(entry -> new CategoryDistributionDto(
                        entry.getKey(),
                        entry.getValue(),
                        Math.round(((double) entry.getValue() / total) * 1000.0) / 10.0
                ))
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());
    }

    private List<ResolutionStateDto> generateResolutionStates(List<Decision> decisions) {
        if (decisions.isEmpty()) {
            return List.of(
                    new ResolutionStateDto("Active", 0, 0),
                    new ResolutionStateDto("Resolved", 0, 0),
                    new ResolutionStateDto("Closed", 0, 0)
            );
        }

        long resolved = decisions.stream().filter(d -> "RESOLVED".equalsIgnoreCase(d.getStatus())).count();
        long closed = decisions.stream().filter(d -> "CLOSED".equalsIgnoreCase(d.getStatus()) || "ARCHIVED".equalsIgnoreCase(d.getStatus())).count();
        long active = decisions.size() - resolved - closed;

        long total = decisions.size();
        return List.of(
                new ResolutionStateDto("Resolved", resolved, Math.round(((double) resolved / total) * 1000.0) / 10.0),
                new ResolutionStateDto("Active / Ongoing", active, Math.round(((double) active / total) * 1000.0) / 10.0),
                new ResolutionStateDto("Closed", closed, Math.round(((double) closed / total) * 1000.0) / 10.0)
        );
    }

    private List<Map<String, Object>> generateCategoryMonthlyTrends(List<Decision> decisions) {
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun"};
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDate now = LocalDate.now();
        int currentMonth = now.getMonthValue();

        for (int i = 5; i >= 0; i--) {
            int targetMonth = ((currentMonth - i - 1 + 12) % 12) + 1;
            String monthName = months[(targetMonth - 1) % months.length];

            Map<String, Object> map = new HashMap<>();
            map.put("month", monthName);

            long tech = decisions.stream().filter(d -> d.getCreatedAt() != null && d.getCreatedAt().getMonthValue() == targetMonth && "Technology".equalsIgnoreCase(d.getCategory())).count();
            long career = decisions.stream().filter(d -> d.getCreatedAt() != null && d.getCreatedAt().getMonthValue() == targetMonth && "Career".equalsIgnoreCase(d.getCategory())).count();
            long finance = decisions.stream().filter(d -> d.getCreatedAt() != null && d.getCreatedAt().getMonthValue() == targetMonth && "Finance".equalsIgnoreCase(d.getCategory())).count();
            long other = decisions.stream().filter(d -> d.getCreatedAt() != null && d.getCreatedAt().getMonthValue() == targetMonth && !"Technology".equalsIgnoreCase(d.getCategory()) && !"Career".equalsIgnoreCase(d.getCategory()) && !"Finance".equalsIgnoreCase(d.getCategory())).count();

            map.put("tech", tech);
            map.put("career", career);
            map.put("finance", finance);
            map.put("other", other);

            result.add(map);
        }
        return result;
    }

    public String generateReportCsv(String type) {
        StringBuilder csv = new StringBuilder();
        if ("voting".equalsIgnoreCase(type)) {
            csv.append("VoteID,DecisionID,DecisionTitle,UserID,Username,OptionID,CreatedAt\n");
            List<Vote> votes = voteRepository.findAll();
            for (Vote v : votes) {
                csv.append(v.getId()).append(",")
                        .append(v.getDecision() != null ? v.getDecision().getId() : "").append(",")
                        .append(v.getDecision() != null ? escapeCsv(v.getDecision().getTitle()) : "").append(",")
                        .append(v.getUser() != null ? v.getUser().getId() : "").append(",")
                        .append(v.getUser() != null ? escapeCsv(v.getUser().getActualUsername()) : "").append(",")
                        .append(v.getOption() != null ? v.getOption().getId() : "").append(",")
                        .append(v.getCreatedAt()).append("\n");
            }
        } else if ("communities".equalsIgnoreCase(type)) {
            csv.append("CommunityID,Name,Category,MemberCount,ModeratorID,ModeratorUsername,CreatedAt\n");
            List<Community> communities = communityRepository.findAll();
            for (Community c : communities) {
                csv.append(c.getId()).append(",")
                        .append(escapeCsv(c.getName())).append(",")
                        .append(escapeCsv(c.getCategory() != null ? c.getCategory() : "General")).append(",")
                        .append(c.getMemberCount() != null ? c.getMemberCount() : 0).append(",")
                        .append(c.getModerator() != null ? c.getModerator().getId() : "").append(",")
                        .append(c.getModerator() != null ? escapeCsv(c.getModerator().getActualUsername()) : "").append(",")
                        .append(c.getCreatedAt()).append("\n");
            }
        } else if ("moderation".equalsIgnoreCase(type) || "audit".equalsIgnoreCase(type)) {
            csv.append("ReportID,TargetType,TargetID,TargetTitle,Reason,Status,ActionTaken,ReporterUsername,ReportedUsername,ModeratorUsername,CreatedAt,ResolvedAt\n");
            List<com.example.backend.entity.Report> reports = reportRepository.findAllByOrderByCreatedAtDesc();
            for (com.example.backend.entity.Report r : reports) {
                csv.append(r.getId()).append(",")
                        .append(escapeCsv(r.getTargetType())).append(",")
                        .append(r.getTargetId() != null ? r.getTargetId() : "").append(",")
                        .append(escapeCsv(r.getTargetTitle())).append(",")
                        .append(escapeCsv(r.getReason())).append(",")
                        .append(escapeCsv(r.getStatus())).append(",")
                        .append(escapeCsv(r.getActionTaken())).append(",")
                        .append(r.getReporter() != null ? escapeCsv(r.getReporter().getActualUsername()) : "").append(",")
                        .append(r.getReportedUser() != null ? escapeCsv(r.getReportedUser().getActualUsername()) : "").append(",")
                        .append(r.getModerator() != null ? escapeCsv(r.getModerator().getActualUsername()) : "").append(",")
                        .append(r.getCreatedAt()).append(",")
                        .append(r.getResolvedAt() != null ? r.getResolvedAt() : "").append("\n");
            }
        } else {
            // Default: decisions report
            csv.append("DecisionID,Title,Category,Status,Visibility,UserID,AuthorUsername,VotesCount,CreatedAt\n");
            List<Decision> decisions = decisionRepository.findAll();
            for (Decision d : decisions) {
                long votes = d.getVotes() != null ? d.getVotes().size() : 0;
                csv.append(d.getId()).append(",")
                        .append(escapeCsv(d.getTitle())).append(",")
                        .append(escapeCsv(d.getCategory() != null ? d.getCategory() : "General")).append(",")
                        .append(escapeCsv(d.getStatus())).append(",")
                        .append(escapeCsv(d.getVisibility())).append(",")
                        .append(d.getUser() != null ? d.getUser().getId() : "").append(",")
                        .append(d.getUser() != null ? escapeCsv(d.getUser().getActualUsername()) : "").append(",")
                        .append(votes).append(",")
                        .append(d.getCreatedAt()).append("\n");
            }
        }
        return csv.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
