package com.snipxn.community.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.BaseEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("comments")
public class Comment extends BaseEntity {

    private String postId;
    private String userId;
    private String parentId;
    private String replyToUserId;
    private String content;
    private Long likeCount;
    private String status = "VISIBLE";
}
