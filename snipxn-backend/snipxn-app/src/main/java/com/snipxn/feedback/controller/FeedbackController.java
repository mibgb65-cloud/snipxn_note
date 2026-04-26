package com.snipxn.feedback.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.Result;
import com.snipxn.feedback.dto.req.CreateFeedbackRequest;
import com.snipxn.feedback.dto.resp.FeedbackResponse;
import com.snipxn.feedback.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/feedbacks")
@RequiredArgsConstructor
@Tag(name = "Feedback", description = "User feedback submission")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @Operation(summary = "Submit user feedback")
    @PostMapping
    public Result<FeedbackResponse> createFeedback(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateFeedbackRequest request) {
        String userId = userDetails == null ? null : userDetails.getUserId();
        return Result.success(feedbackService.createFeedback(userId, request));
    }
}
