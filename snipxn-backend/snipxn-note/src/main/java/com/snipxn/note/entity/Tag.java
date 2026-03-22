package com.snipxn.note.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.SyncEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("tags")
public class Tag extends SyncEntity {

    private String userId;
    private String name;
    private String color;
}
