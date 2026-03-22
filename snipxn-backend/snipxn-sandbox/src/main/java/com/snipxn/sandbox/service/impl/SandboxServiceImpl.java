package com.snipxn.sandbox.service.impl;

import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.sandbox.dto.req.RunCodeRequest;
import com.snipxn.sandbox.dto.resp.RunCodeResponse;
import com.snipxn.sandbox.service.SandboxService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Service
public class SandboxServiceImpl implements SandboxService {

    private final RestClient restClient;
    private final int timeout;

    private static final Map<String, Integer> LANGUAGE_MAP = Map.ofEntries(
            Map.entry("python", 109),
            Map.entry("javascript", 102),
            Map.entry("typescript", 101),
            Map.entry("java", 91),
            Map.entry("c", 103),
            Map.entry("cpp", 105),
            Map.entry("c++", 105),
            Map.entry("go", 107),
            Map.entry("rust", 108),
            Map.entry("ruby", 72),
            Map.entry("php", 98),
            Map.entry("csharp", 51),
            Map.entry("c#", 51),
            Map.entry("kotlin", 111),
            Map.entry("swift", 83)
    );

    public SandboxServiceImpl(
            @Value("${snipxn.sandbox.judge0-url}") String judge0Url,
            @Value("${snipxn.sandbox.timeout:15}") int timeout) {
        this.restClient = RestClient.builder().baseUrl(judge0Url).build();
        this.timeout = timeout;
    }

    @Override
    public RunCodeResponse runCode(RunCodeRequest request) {
        String lang = request.getLanguage().toLowerCase().trim();
        Integer languageId = LANGUAGE_MAP.get(lang);
        if (languageId == null) {
            throw new BusinessException(ErrorCode.SANDBOX_LANGUAGE_NOT_SUPPORTED);
        }

        Map<String, Object> body = Map.of(
                "language_id", languageId,
                "source_code", request.getSourceCode(),
                "stdin", request.getStdin() != null ? request.getStdin() : "",
                "cpu_time_limit", timeout
        );

        try {
            Map<?, ?> result = restClient.post()
                    .uri("/submissions?base64_encoded=false&wait=true")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (result == null) {
                throw new BusinessException(ErrorCode.SANDBOX_EXECUTION_FAILED);
            }

            return parseJudge0Response(result);
        } catch (BusinessException e) {
            throw e;
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
        String time = strVal(result.get("time"));
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
        return obj != null ? obj.toString() : "";
    }
}
