package com.snipxn.ai.dto.resp;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiResponse {

    private String content;

    private String model;

    private Integer totalTokens;
}
