package com.snipxn.community.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class CommentResponse {

    private String id;
    private String postId;
    private String userId;
    private String parentId;
    private String replyToUserId;
    private String replyToNickname;
    private String content;
    private Long likeCount;
    private Long replyCount;
    private OffsetDateTime createdAt;
    private String authorNickname;
    private String authorAvatar;
    private Boolean liked;
}
