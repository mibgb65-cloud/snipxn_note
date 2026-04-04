package com.snipxn.version.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.BaseEntity;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@TableName("app_version")
public class AppVersion extends BaseEntity {

    private String platform;

    private String version;

    private String buildNumber;

    private String updateUrl;

    private String releaseNotes;

    private OffsetDateTime publishedAt;
}
