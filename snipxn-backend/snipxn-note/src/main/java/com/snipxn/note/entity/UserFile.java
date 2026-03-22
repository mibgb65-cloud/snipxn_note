package com.snipxn.note.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@TableName("user_files")
public class UserFile {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String userId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private byte[] fileData;
    private OffsetDateTime uploadedAt;
}
