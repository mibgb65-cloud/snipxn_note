package com.snipxn.community.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@TableName("user_follows")
public class UserFollow {

    private String followerId;
    private String followingId;
    @TableField(fill = FieldFill.INSERT)
    private OffsetDateTime createdAt;
}
