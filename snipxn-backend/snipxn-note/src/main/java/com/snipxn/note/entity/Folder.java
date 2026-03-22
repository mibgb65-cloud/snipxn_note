package com.snipxn.note.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.SyncEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("folders")
public class Folder extends SyncEntity {

    private String userId;
    private String name;
    private String icon;
    private Boolean isDefault;
    private String rankIndex;
}
