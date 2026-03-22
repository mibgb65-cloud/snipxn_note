package com.snipxn.note.dto.resp;

import lombok.Data;

@Data
public class UploadResponse {

    private String fileId;
    private String url;
    private Long fileSize;
}
