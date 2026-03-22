package com.snipxn.sandbox.dto.resp;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RunCodeResponse {

    private String status;

    private String stdout;

    private String stderr;

    /** 运行时间（秒） */
    private String time;

    /** 内存（KB） */
    private Integer memory;
}
