package com.snipxn.ai.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.snipxn.ai.dto.req.CodeGenerateRequest;
import com.snipxn.ai.dto.req.CodeReviewRequest;
import com.snipxn.ai.dto.resp.AiResponse;
import com.snipxn.ai.service.AiService;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Consumer;

@Slf4j
@Service
public class AiServiceImpl implements AiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final URI chatCompletionsUri;
    private final String apiKey;
    private final String model;
    private final int maxTokens;
    private final boolean thinkingEnabled;
    private final String reasoningEffort;

    public AiServiceImpl(
            ObjectMapper objectMapper,
            @Value("${snipxn.ai.deepseek-url}") String deepseekUrl,
            @Value("${snipxn.ai.api-key}") String apiKey,
            @Value("${snipxn.ai.model:deepseek-v4-flash}") String model,
            @Value("${snipxn.ai.max-tokens:2048}") int maxTokens,
            @Value("${snipxn.ai.thinking-enabled:false}") boolean thinkingEnabled,
            @Value("${snipxn.ai.reasoning-effort:high}") String reasoningEffort) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.maxTokens = maxTokens;
        this.thinkingEnabled = thinkingEnabled;
        this.reasoningEffort = normalizeReasoningEffort(reasoningEffort);
        this.chatCompletionsUri = buildChatCompletionsUri(deepseekUrl);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.restClient = RestClient.builder()
                .baseUrl(deepseekUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    @Override
    public AiResponse reviewCode(CodeReviewRequest request) {
        String systemPrompt = "你是一位资深的编程助手。用户会给出一段代码和对应的错误信息，请你分析错误原因，并给出修复建议。" +
                "回答使用 Markdown 格式，包含：1. 错误原因分析 2. 修复建议 3. 修正后的代码片段。保持简洁、直接。";

        String userPrompt = buildReviewPrompt(request);
        return callChatCompletions(systemPrompt, userPrompt);
    }

    @Override
    public AiResponse generateCode(CodeGenerateRequest request) {
        String systemPrompt = "你是一位资深的编程助手。用户会给出一段需求描述，请你根据需求生成对应的代码。" +
                "回答使用 Markdown 格式，包含：1. 实现思路简述 2. 完整代码。保持简洁、直接。";

        String userPrompt = buildGeneratePrompt(request);
        return callChatCompletions(systemPrompt, userPrompt);
    }

    @Override
    public void streamGenerateCode(CodeGenerateRequest request, Consumer<String> chunkConsumer) {
        String systemPrompt = "你是一位资深的编程助手。用户会给出一段需求描述，请你根据需求生成对应的代码。" +
                "回答使用 Markdown 格式，包含：1. 实现思路简述 2. 完整代码。保持简洁、直接。";

        String userPrompt = buildGeneratePrompt(request);
        callChatCompletionsStream(systemPrompt, userPrompt, chunkConsumer);
    }

    private String buildReviewPrompt(CodeReviewRequest request) {
        StringBuilder sb = new StringBuilder();
        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            sb.append("编程语言：").append(request.getLanguage()).append("\n\n");
        }
        sb.append("错误信息：\n```\n").append(request.getErrorMessage()).append("\n```\n\n");
        sb.append("代码：\n```").append(request.getLanguage() != null ? request.getLanguage() : "").append("\n")
                .append(request.getCode()).append("\n```");
        return sb.toString();
    }

    private String buildGeneratePrompt(CodeGenerateRequest request) {
        StringBuilder sb = new StringBuilder();
        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            sb.append("请使用 ").append(request.getLanguage()).append(" 语言。\n\n");
        }
        sb.append("需求描述：\n").append(request.getDescription());
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private AiResponse callChatCompletions(String systemPrompt, String userPrompt) {
        try {
            Map<String, Object> body = buildChatCompletionsBody(systemPrompt, userPrompt, false);
            String jsonBody = objectMapper.writeValueAsString(body);
            log.debug("DeepSeek request: {}", jsonBody);

            Map<?, ?> result = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(jsonBody)
                    .retrieve()
                    .body(Map.class);

            if (result == null) {
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }

            log.debug("DeepSeek response: {}", result);
            return parseResponse(result);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("DeepSeek API 调用失败", e);
            throw new BusinessException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }

    private void callChatCompletionsStream(String systemPrompt, String userPrompt, Consumer<String> chunkConsumer) {
        try {
            Map<String, Object> body = buildChatCompletionsBody(systemPrompt, userPrompt, true);
            String jsonBody = objectMapper.writeValueAsString(body);
            log.debug("DeepSeek stream request: {}", jsonBody);

            HttpRequest httpRequest = HttpRequest.newBuilder(chatCompletionsUri)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .header("Accept", MediaType.TEXT_EVENT_STREAM_VALUE)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<InputStream> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofInputStream());
            int statusCode = response.statusCode();
            if (statusCode < 200 || statusCode >= 300) {
                log.warn("DeepSeek stream request failed, status={}, body={}", statusCode, readErrorBody(response.body()));
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }

            readStreamResponse(response.body(), chunkConsumer);
        } catch (BusinessException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        } catch (Exception e) {
            log.error("DeepSeek API 流式调用失败", e);
            throw new BusinessException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }

    private Map<String, Object> buildChatCompletionsBody(String systemPrompt, String userPrompt, boolean stream) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("max_tokens", maxTokens);
        body.put("stream", stream);
        body.put("thinking", Map.of("type", thinkingEnabled ? "enabled" : "disabled"));
        if (thinkingEnabled) {
            body.put("reasoning_effort", reasoningEffort);
        }
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));
        return body;
    }

    private void readStreamResponse(InputStream body, Consumer<String> chunkConsumer) throws Exception {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(body, StandardCharsets.UTF_8))) {
            StringBuilder eventData = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    if (handleStreamEvent(eventData.toString(), chunkConsumer)) {
                        return;
                    }
                    eventData.setLength(0);
                    continue;
                }

                if (line.startsWith("data:")) {
                    if (!eventData.isEmpty()) {
                        eventData.append('\n');
                    }
                    eventData.append(line.substring(5).trim());
                }
            }

            if (!eventData.isEmpty()) {
                handleStreamEvent(eventData.toString(), chunkConsumer);
            }
        }
    }

    @SuppressWarnings("unchecked")
    private boolean handleStreamEvent(String payload, Consumer<String> chunkConsumer) throws Exception {
        if (payload == null || payload.isBlank()) {
            return false;
        }

        String trimmed = payload.trim();
        if ("[DONE]".equals(trimmed)) {
            return true;
        }

        Map<String, Object> chunk = objectMapper.readValue(trimmed, Map.class);
        List<Map<String, Object>> choices = (List<Map<String, Object>>) chunk.get("choices");
        if (choices == null || choices.isEmpty()) {
            return false;
        }

        Map<String, Object> choice = choices.get(0);
        Object deltaValue = choice.get("delta");
        if (deltaValue instanceof Map<?, ?> delta && delta.get("content") instanceof String content && !content.isEmpty()) {
            chunkConsumer.accept(content);
            return false;
        }

        Object messageValue = choice.get("message");
        if (messageValue instanceof Map<?, ?> message && message.get("content") instanceof String content && !content.isEmpty()) {
            chunkConsumer.accept(content);
        }

        return false;
    }

    private String readErrorBody(InputStream body) {
        if (body == null) {
            return "";
        }

        try (body) {
            return new String(body.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    private URI buildChatCompletionsUri(String baseUrl) {
        String normalizedBaseUrl = baseUrl == null ? "" : baseUrl.trim();
        while (normalizedBaseUrl.endsWith("/")) {
            normalizedBaseUrl = normalizedBaseUrl.substring(0, normalizedBaseUrl.length() - 1);
        }
        return URI.create(normalizedBaseUrl + "/chat/completions");
    }

    @SuppressWarnings("unchecked")
    private AiResponse parseResponse(Map<?, ?> result) {
        List<Map<String, Object>> choices = (List<Map<String, Object>>) result.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        String content = "";
        if (message != null && message.get("content") instanceof String messageContent) {
            content = messageContent;
        }

        String responseModel = (String) result.get("model");

        Integer totalTokens = null;
        Map<String, Object> usage = (Map<String, Object>) result.get("usage");
        if (usage != null && usage.get("total_tokens") != null) {
            totalTokens = ((Number) usage.get("total_tokens")).intValue();
        }

        return AiResponse.builder()
                .content(content)
                .model(responseModel)
                .totalTokens(totalTokens)
                .build();
    }

    private String normalizeReasoningEffort(String value) {
        if (value == null || value.isBlank()) {
            return "high";
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "low", "medium", "high" -> normalized;
            case "max", "xhigh" -> "max";
            default -> {
                log.warn("Unsupported DeepSeek reasoning_effort '{}', fallback to 'high'", value);
                yield "high";
            }
        };
    }
}
