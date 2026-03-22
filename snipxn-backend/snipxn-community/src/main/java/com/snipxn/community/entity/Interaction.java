package com.snipxn.community.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.BaseEntity;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@TableName("interactions")
public class Interaction extends BaseEntity {

    private String userId;
    private String targetId;
    private String targetType;
    private String actionType;

    @TableField(exist = false)
    private OffsetDateTime updatedAt;
}
