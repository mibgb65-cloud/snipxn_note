package com.snipxn.community.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class PostDetailResponse {

    private String id;
    private String userId;
    private String originNoteId;
    private String title;
    private String content;
    private String language;
    private List<String> tags;
    private Long viewCount;
    private Long likeCount;
    private Long collectCount;
    private Long commentCount;
    private Long shareCount;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private String authorNickname;
    private String authorAvatar;
    private Boolean liked;
    private Boolean collected;
}
