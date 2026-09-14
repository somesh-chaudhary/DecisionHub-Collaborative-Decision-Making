package com.example.backend.dto;

public class VoteRequest {
    private Long optionId;
    private String voteType;

    public VoteRequest() {}

    public Long getOptionId() { return optionId; }
    public void setOptionId(Long optionId) { this.optionId = optionId; }

    public String getVoteType() { return voteType; }
    public void setVoteType(String voteType) { this.voteType = voteType; }
}
