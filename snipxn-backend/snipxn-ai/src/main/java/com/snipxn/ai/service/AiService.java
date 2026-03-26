package com.snipxn.ai.service;

import com.snipxn.ai.dto.req.CodeGenerateRequest;
import com.snipxn.ai.dto.req.CodeReviewRequest;
import com.snipxn.ai.dto.resp.AiResponse;

public interface AiService {

    AiResponse reviewCode(CodeReviewRequest request);

    AiResponse generateCode(CodeGenerateRequest request);
}
