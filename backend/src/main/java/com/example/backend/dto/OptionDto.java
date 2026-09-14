package com.example.backend.dto;

import java.time.LocalDateTime;

public class OptionDto {

    private Long id;
    private Long decisionId;
    private String optionTitle;
    private String description;
    private String pros;
    private String cons;
    private Integer score;
    private Integer ranking;
    private LocalDateTime createdAt;

    // Constructors, Getters, Setters
    public OptionDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getDecisionId() { return decisionId; }
    public void setDecisionId(Long decisionId) { this.decisionId = decisionId; }
    public String getOptionTitle() { return optionTitle; }
    public void setOptionTitle(String optionTitle) { this.optionTitle = optionTitle; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPros() { return pros; }
    public void setPros(String pros) { this.pros = pros; }
    public String getCons() { return cons; }
    public void setCons(String cons) { this.cons = cons; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public Integer getRanking() { return ranking; }
    public void setRanking(Integer ranking) { this.ranking = ranking; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
