package com.snipxn.note.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("note_tags")
public class NoteTag {

    private String noteId;
    private String tagId;
}
