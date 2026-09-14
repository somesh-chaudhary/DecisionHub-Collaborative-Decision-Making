package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackRequest {

    private Integer rating;

    private String category;

    @NotBlank(message = "Comment is required.")
    private String comment;
}
