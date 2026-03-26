package com.snipxn.sandbox.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.sandbox.dto.req.RunCodeRequest;
import com.snipxn.sandbox.dto.resp.RunCodeResponse;
import com.snipxn.sandbox.service.SandboxService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
public class SandboxServiceImpl implements SandboxService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final int timeout;

    private static final Map<String, Integer> LANGUAGE_MAP = Map.ofEntries(
            Map.entry("python", 71),       // Python (3.8.1)
            Map.entry("javascript", 63),   // JavaScript (Node.js 12.14.0)
            Map.entry("typescript", 74),   // TypeScript (3.7.4)
            Map.entry("java", 62),         // Java (OpenJDK 13.0.1)
            Map.entry("c", 50),            // C (GCC 9.2.0)
            Map.entry("cpp", 54),          // C++ (GCC 9.2.0)
            Map.entry("c++", 54),          // C++ (GCC 9.2.0)
            Map.entry("go", 60),           // Go (1.13.5)
            Map.entry("rust", 73),         // Rust (1.40.0)
            Map.entry("ruby", 72),         // Ruby (2.7.0)
            Map.entry("php", 68),          // PHP (7.4.1)
            Map.entry("csharp", 51),       // C# (Mono 6.6.0.161)
            Map.entry("c#", 51),           // C# (Mono 6.6.0.161)
            Map.entry("kotlin", 78),       // Kotlin (1.3.70)
            Map.entry("swift", 83)         // Swift (5.2.3)
    );

    public SandboxServiceImpl(
            ObjectMapper objectMapper,
            @Value("${snipxn.sandbox.judge0-url}") String judge0Url,
            @Value("${snipxn.sandbox.judge0-api-key:}") String apiKey,
            @Value("${snipxn.sandbox.timeout:15}") int timeout) {
        this.restClient = RestClient.builder().baseUrl(judge0Url).build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.timeout = timeout;
    }

    @Override
    public RunCodeResponse runCode(RunCodeRequest request) {
        String lang = request.getLanguage().toLowerCase().trim();
        Integer languageId = LANGUAGE_MAP.get(lang);
        if (languageId == null) {
            throw new BusinessException(ErrorCode.SANDBOX_LANGUAGE_NOT_SUPPORTED);
        }

        String sourceCode = Base64.getEncoder().encodeToString(
                request.getSourceCode().getBytes(StandardCharsets.UTF_8));
        String stdin = Base64.getEncoder().encodeToString(
                (request.getStdin() != null ? request.getStdin() : "").getBytes(StandardCharsets.UTF_8));

        Map<String, Object> body = Map.of(
                "language_id", languageId,
                "source_code", sourceCode,
                "stdin", stdin,
                "cpu_time_limit", timeout
        );

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            log.debug("Judge0 request: {}", jsonBody);

            var requestSpec = restClient.post()
                    .uri("/submissions?base64_encoded=true&wait=true")
                    .contentType(MediaType.APPLICATION_JSON);

            // RapidAPI 需要额外的认证头
            if (StringUtils.hasText(apiKey)) {
                requestSpec.header("X-RapidAPI-Key", apiKey);
                requestSpec.header("X-RapidAPI-Host", "judge0-ce.p.rapidapi.com");
            }

            Map<?, ?> result = requestSpec
                    .body(jsonBody)
                    .retrieve()
                    .body(Map.class);

            if (result == null) {
                throw new BusinessException(ErrorCode.SANDBOX_EXECUTION_FAILED);
            }

            log.debug("Judge0 response: {}", result);
            return parseJudge0Response(result);
        } catch (BusinessException e) {
            throw e;
        } catch (JsonProcessingException e) {
            log.error("Judge0 请求序列化失败", e);
            throw new BusinessException(ErrorCode.SANDBOX_EXECUTION_FAILED);
        } catch (Exception e) {
            log.error("Judge0 调用失败", e);
            throw new BusinessException(ErrorCode.SANDBOX_EXECUTION_FAILED);
        }
    }

    private RunCodeResponse parseJudge0Response(Map<?, ?> result) {
        // Judge0 status: 3=Accepted, 6=Compilation Error, others=error
        Map<?, ?> statusObj = (Map<?, ?>) result.get("status");
        int statusId = statusObj != null ? ((Number) statusObj.get("id")).intValue() : 0;

        String stdout = strVal(result.get("stdout"));
        String stderr = strVal(result.get("stderr"));
        String compileOutput = strVal(result.get("compile_output"));
        String time = result.get("time") != null ? result.get("time").toString() : null;
        Number memoryNum = (Number) result.get("memory");
        Integer memory = memoryNum != null ? memoryNum.intValue() : null;

        // 编译错误时把 compile_output 放到 stderr
        if (stderr.isEmpty() && !compileOutput.isEmpty()) {
            stderr = compileOutput;
        }

        String status = (statusId == 3) ? "success" : "error";

        return RunCodeResponse.builder()
                .status(status)
                .stdout(stdout)
                .stderr(stderr)
                .time(time)
                .memory(memory)
                .build();
    }

    private String strVal(Object obj) {
        if (obj == null) return "";
        String val = obj.toString().strip();
        if (val.isEmpty()) return "";
        try {
            return new String(Base64.getMimeDecoder().decode(val), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return val;
        }
    }
}
