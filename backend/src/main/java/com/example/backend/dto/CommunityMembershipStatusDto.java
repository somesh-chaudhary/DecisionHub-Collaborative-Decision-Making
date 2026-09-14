package com.example.backend.dto;

public class CommunityMembershipStatusDto {

    private boolean member;
    private boolean pending;
    private boolean moderator;

    public CommunityMembershipStatusDto() {
    }

    public CommunityMembershipStatusDto(boolean member,
                                        boolean pending,
                                        boolean moderator) {
        this.member = member;
        this.pending = pending;
        this.moderator = moderator;
    }

    public boolean isMember() {
        return member;
    }

    public void setMember(boolean member) {
        this.member = member;
    }

    public boolean isPending() {
        return pending;
    }

    public void setPending(boolean pending) {
        this.pending = pending;
    }

    public boolean isModerator() {
        return moderator;
    }

    public void setModerator(boolean moderator) {
        this.moderator = moderator;
    }
}