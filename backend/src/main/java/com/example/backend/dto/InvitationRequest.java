package com.example.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InvitationRequest {
    @NotBlank(message = "Invitee email is required")
    @Email(message = "Enter a valid email address")
    private String inviteeEmail;
}
