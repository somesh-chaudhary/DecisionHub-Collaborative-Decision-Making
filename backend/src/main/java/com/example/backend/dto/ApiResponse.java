package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private T data;
    
    @Builder.Default
    private String timestamp = LocalDateTime.now().toString();

    // Convenience constructor for success or error responses without data
    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.timestamp = LocalDateTime.now().toString();
    }
}
