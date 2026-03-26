package com.snipxn.community.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class PublicPostResponse {
    private String title;
    private String content;
    private String language;
    private List<String> tags;
    private String authorNickname;
    private String authorAvatar;
    private Long viewCount;
    private Long likeCount;
    private Long commentCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
