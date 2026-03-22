package com.snipxn.auth.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@TableName("user_settings")
public class UserSettings {

    /** user_id 既是主键也是外键（一对一） */
    @TableId
    private String userId;
    /** JSONB 存储，MyBatis Plus 以字符串读写，序列化由应用层处理 */
    private String preferences;
    private OffsetDateTime updatedAt;
}
