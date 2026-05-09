package com.snipxn.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI", description = "AI 代码审查与代码生成接口")
@SecurityRequirement(name = "Bearer Token")
public class AiController {

    private final AiService aiService;
    private final ObjectMapper objectMapper;

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

    @Operation(summary = "AI 流式代码生成", description = "根据需求描述生成代码，并通过 SSE 增量返回内容")
    @PostMapping(value = "/generate/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public StreamingResponseBody streamGenerateCode(@Valid @RequestBody CodeGenerateRequest request) {
        return outputStream -> {
            try {
                aiService.streamGenerateCode(request, chunk -> writeSseEvent(outputStream, "delta", Map.of("content", chunk)));
                writeSseEvent(outputStream, "done", Map.of("done", true));
            } catch (Exception e) {
                log.error("AI 流式生成失败", e);
                writeSseEvent(outputStream, "error", Map.of("message", "AI generation failed"));
            }
        };
    }

    private void writeSseEvent(OutputStream outputStream, String eventName, Map<String, ?> payload) {
        try {
            String data = objectMapper.writeValueAsString(payload);
            String event = "event: " + eventName + "\n" + "data: " + data + "\n\n";
            outputStream.write(event.getBytes(StandardCharsets.UTF_8));
            outputStream.flush();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to write SSE event", e);
        }
    }
}
