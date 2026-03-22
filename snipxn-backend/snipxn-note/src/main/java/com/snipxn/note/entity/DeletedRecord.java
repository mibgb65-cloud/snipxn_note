package com.snipxn.note.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@TableName("deleted_records")
public class DeletedRecord {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;
    private String userId;
    private String tableName;
    private String recordId;
    private OffsetDateTime deletedAt;
}
