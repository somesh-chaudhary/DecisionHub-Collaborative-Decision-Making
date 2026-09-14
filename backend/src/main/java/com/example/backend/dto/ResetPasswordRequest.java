package com.example.backend.dto;

public class ResetPasswordRequest {

    private String usernameOrEmail;
    private String newPassword;

    public ResetPasswordRequest() {
    }

    public ResetPasswordRequest(String usernameOrEmail, String newPassword) {
        this.usernameOrEmail = usernameOrEmail;
        this.newPassword = newPassword;
    }

    public String getUsernameOrEmail() {
        return usernameOrEmail;
    }

    public void setUsernameOrEmail(String usernameOrEmail) {
        this.usernameOrEmail = usernameOrEmail;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
