package com.snipxn.community.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.BaseEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("post_shares")
public class PostShare extends BaseEntity {
    private String postId;
    private String userId;
    private String shareToken;
}
