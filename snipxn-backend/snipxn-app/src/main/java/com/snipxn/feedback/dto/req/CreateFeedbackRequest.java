package com.snipxn.feedback.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
@Schema(name = "CreateFeedbackRequest", description = "User feedback submission")
public class CreateFeedbackRequest {

    @NotBlank(message = "Feedback content cannot be empty")
    @Size(max = 5000, message = "Feedback content cannot exceed 5000 characters")
    @Schema(description = "Feedback content", example = "The editor cursor jumps after inserting an image.")
    private String content;

    @Size(max = 100, message = "Contact cannot exceed 100 characters")
    @Schema(description = "Optional contact email, phone, or social handle", example = "user@example.com")
    private String contact;

    @Size(max = 5, message = "At most 5 images are allowed")
    @Schema(description = "Optional screenshot URLs", example = "[\"/api/v1/files/xxx\"]")
    private List<@Size(max = 512, message = "Image URL cannot exceed 512 characters") String> images;
}
