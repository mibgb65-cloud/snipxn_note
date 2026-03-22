package com.snipxn.community.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class PostListItemResponse {

    private String id;
    private String userId;
    private String title;
    private String language;
    private List<String> tags;
    private Long viewCount;
    private Long likeCount;
    private Long collectCount;
    private Long commentCount;
    private String status;
    private OffsetDateTime createdAt;
    private String authorNickname;
    private String authorAvatar;
}
