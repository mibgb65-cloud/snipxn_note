package com.snipxn.community.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.BaseEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("posts")
public class Post extends BaseEntity {

    private String userId;
    private String originNoteId;
    private String title;
    private String content;
    private String language;
    /** JSONB 存储，MyBatis Plus 以字符串读写，序列化由应用层处理 */
    private String tags;
    private Long viewCount;
    private Long likeCount;
    private Long collectCount;
    private Long commentCount;
    private String status = "PUBLISHED";
}
