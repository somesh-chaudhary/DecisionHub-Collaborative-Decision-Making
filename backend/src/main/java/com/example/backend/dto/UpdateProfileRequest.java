package com.example.backend.dto;

public class UpdateProfileRequest {

    private String fullName;
    private String interests;
    private String email;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String fullName, String interests, String email) {
        this.fullName = fullName;
        this.interests = interests;
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getInterests() {
        return interests;
    }

    public void setInterests(String interests) {
        this.interests = interests;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
