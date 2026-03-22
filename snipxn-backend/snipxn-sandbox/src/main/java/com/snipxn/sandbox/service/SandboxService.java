package com.snipxn.sandbox.service;

import com.snipxn.sandbox.dto.req.RunCodeRequest;
import com.snipxn.sandbox.dto.resp.RunCodeResponse;

public interface SandboxService {

    RunCodeResponse runCode(RunCodeRequest request);
}
