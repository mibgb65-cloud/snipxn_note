package com.snipxn.ai.controller;

import com.snipxn.ai.dto.req.CodeGenerateRequest;
import com.snipxn.ai.dto.req.CodeReviewRequest;
import com.snipxn.ai.dto.resp.AiResponse;
import com.snipxn.ai.service.AiService;
import com.snipxn.common.result.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/review")
    public Result<AiResponse> reviewCode(@Valid @RequestBody CodeReviewRequest request) {
        return Result.success(aiService.reviewCode(request));
    }

    @PostMapping("/generate")
    public Result<AiResponse> generateCode(@Valid @RequestBody CodeGenerateRequest request) {
        return Result.success(aiService.generateCode(request));
    }
}
