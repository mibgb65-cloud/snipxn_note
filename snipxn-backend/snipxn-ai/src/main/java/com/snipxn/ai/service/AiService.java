package com.snipxn.ai.service;

import com.snipxn.ai.dto.req.CodeGenerateRequest;
import com.snipxn.ai.dto.req.CodeReviewRequest;
import com.snipxn.ai.dto.resp.AiResponse;

import java.util.function.Consumer;

public interface AiService {

    AiResponse reviewCode(CodeReviewRequest request);

    AiResponse generateCode(CodeGenerateRequest request);

    void streamGenerateCode(CodeGenerateRequest request, Consumer<String> chunkConsumer);
}
