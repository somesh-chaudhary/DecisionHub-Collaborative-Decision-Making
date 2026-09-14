package com.example.backend.dto;

public class DecisionRequest {

    private String title;
    private String description;
    private String category;
    private Long communityId;
    private java.util.List<OptionRequest> options;

    public Long getCommunityId() {
        return communityId;
    }

    public void setCommunityId(Long communityId) {
        this.communityId = communityId;
    }

    public java.util.List<OptionRequest> getOptions() {
        return options;
    }

    public void setOptions(java.util.List<OptionRequest> options) {
        this.options = options;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public DecisionRequest() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}