package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ModerationActionRequestDto {

    @NotBlank(message = "Action is required (DISMISS, WARN, DELETE_CONTENT, SUSPEND_USER, BAN_USER)")
    private String action;

    private String moderatorNotes;

    private String warningMessage;
}
