package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackReplyRequest {

    @NotBlank(message = "Admin reply cannot be blank.")
    private String adminReply;
}
