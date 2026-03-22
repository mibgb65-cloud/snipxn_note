package com.snipxn.sandbox.controller;

import com.snipxn.common.result.Result;
import com.snipxn.sandbox.dto.req.RunCodeRequest;
import com.snipxn.sandbox.dto.resp.RunCodeResponse;
import com.snipxn.sandbox.service.SandboxService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sandbox")
@RequiredArgsConstructor
public class SandboxController {

    private final SandboxService sandboxService;

    @PostMapping("/run")
    public Result<RunCodeResponse> run(@Valid @RequestBody RunCodeRequest request) {
        return Result.success(sandboxService.runCode(request));
    }
}
