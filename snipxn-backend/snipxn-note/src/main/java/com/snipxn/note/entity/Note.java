package com.snipxn.note.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.SyncEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("notes")
public class Note extends SyncEntity {

    private String userId;
    private String folderId;
    private String title;
    private String content;
    private String summary;
    private String primaryLanguage;
    private Boolean isStarred;
    /** NORMAL / ARCHIVED / LOCKED */
    private String status;
    private String lastDeviceId;
}
