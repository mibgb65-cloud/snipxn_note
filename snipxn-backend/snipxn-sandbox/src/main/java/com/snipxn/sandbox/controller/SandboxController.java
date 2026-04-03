package com.snipxn.sandbox.controller;

import com.snipxn.common.result.Result;
import com.snipxn.sandbox.dto.req.RunCodeRequest;
import com.snipxn.sandbox.dto.resp.RunCodeResponse;
import com.snipxn.sandbox.service.SandboxService;
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
@RequestMapping("/api/v1/sandbox")
@RequiredArgsConstructor
@Tag(name = "沙箱", description = "在线代码运行沙箱接口")
@SecurityRequirement(name = "Bearer Token")
public class SandboxController {

    private final SandboxService sandboxService;

    @Operation(summary = "运行代码", description = "提交语言、源代码和标准输入，返回运行输出与执行状态")
    @PostMapping("/run")
    public Result<RunCodeResponse> run(@Valid @RequestBody RunCodeRequest request) {
        return Result.success(sandboxService.runCode(request));
    }
}
