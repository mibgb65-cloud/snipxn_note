package com.snipxn.feedback.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@TableName("feedbacks")
public class Feedback {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String content;

    private String contact;

    private String images;

    private String status;

    private String adminReply;

    @TableField(fill = FieldFill.INSERT)
    private OffsetDateTime createdAt;
}
