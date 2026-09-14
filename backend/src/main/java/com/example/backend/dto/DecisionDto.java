package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DecisionDto {

    private Long id;
    private Long userId;
    private String title;
    private String description;
    private String category;
    private Long communityId;
    private String communityName;
    private String status;
    private String visibility;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OptionDto> options;
    private Long votedOptionId;
    private Boolean isDiscussionLocked;

    public DecisionDto() {}

    // Getters and Setters
    public Long getVotedOptionId() { return votedOptionId; }
    public void setVotedOptionId(Long votedOptionId) { this.votedOptionId = votedOptionId; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Long getCommunityId() { return communityId; }
    public void setCommunityId(Long communityId) { this.communityId = communityId; }
    public String getCommunityName() { return communityName; }
    public void setCommunityName(String communityName) { this.communityName = communityName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<OptionDto> getOptions() { return options; }
    public void setOptions(List<OptionDto> options) { this.options = options; }
    public Boolean getIsDiscussionLocked() { return isDiscussionLocked != null ? isDiscussionLocked : false; }
    public void setIsDiscussionLocked(Boolean isDiscussionLocked) { this.isDiscussionLocked = isDiscussionLocked; }
}
