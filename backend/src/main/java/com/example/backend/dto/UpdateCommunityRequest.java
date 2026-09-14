package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateCommunityRequest {

    @NotBlank(message = "Community name is required.")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Category is required.")
    @Size(max = 100)
    private String category;

    @Size(max = 500)
    private String description;
}