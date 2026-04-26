package com.snipxn.feedback.dto.resp;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Schema(name = "FeedbackResponse", description = "Created feedback summary")
public class FeedbackResponse {

    @Schema(description = "Feedback ID")
    private String id;

    @Schema(description = "Processing status", example = "PENDING")
    private String status;

    @Schema(description = "Submission time")
    private OffsetDateTime createdAt;

    @Schema(description = "Whether confirmation email was queued")
    private Boolean confirmationEmailQueued;
}
