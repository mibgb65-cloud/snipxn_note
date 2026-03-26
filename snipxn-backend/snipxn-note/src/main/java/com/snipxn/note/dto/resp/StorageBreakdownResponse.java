package com.snipxn.note.dto.resp;

import lombok.Data;

@Data
public class StorageBreakdownResponse {
    private long totalLimit;
    private long totalUsed;
    private long noteBytes;
    private long imageBytes;
    private long deletedBytes;
    private int noteCount;
    private int imageCount;
}
