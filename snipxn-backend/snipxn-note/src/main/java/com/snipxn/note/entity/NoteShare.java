package com.snipxn.note.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.BaseEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("note_shares")
public class NoteShare extends BaseEntity {
    private String noteId;
    private String userId;
    private String shareToken;
}
