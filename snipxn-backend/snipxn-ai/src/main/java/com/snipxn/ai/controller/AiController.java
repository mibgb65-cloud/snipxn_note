package com.snipxn.ai.controller;

import com.snipxn.ai.dto.req.CodeGenerateRequest;
import com.snipxn.ai.dto.req.CodeReviewRequest;
import com.snipxn.ai.dto.resp.AiResponse;
import com.snipxn.ai.service.AiService;
import com.snipxn.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI", description = "AI 代码审查与代码生成接口")
@SecurityRequirement(name = "Bearer Token")
public class AiController {

    private final AiService aiService;

    @Operation(summary = "AI 代码审查", description = "提交代码和错误信息，返回问题分析与修改建议")
    @PostMapping("/review")
    public Result<AiResponse> reviewCode(@Valid @RequestBody CodeReviewRequest request) {
        return Result.success(aiService.reviewCode(request));
    }

    @Operation(summary = "AI 代码生成", description = "根据需求描述生成对应语言的代码结果")
    @PostMapping("/generate")
    public Result<AiResponse> generateCode(@Valid @RequestBody CodeGenerateRequest request) {
        return Result.success(aiService.generateCode(request));
    }
}
