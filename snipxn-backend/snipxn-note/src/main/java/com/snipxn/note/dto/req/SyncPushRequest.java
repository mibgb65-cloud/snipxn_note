package com.snipxn.note.dto.req;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Schema(name = "SyncPushRequest", description = "客户端同步上行请求，提交本地变更后由服务端进行合并")
public class SyncPushRequest {

    @Schema(description = "发起同步的设备 ID", example = "web-chrome-a1b2c3")
    private String deviceId;
    @Schema(description = "客户端上次成功拉取时间，ISO-8601 格式", example = "2026-04-01T10:20:30+08:00")
    private OffsetDateTime lastPulledAt;
    @Schema(description = "文件夹变更列表")
    private List<FolderChange> folders;
    @Schema(description = "笔记变更列表")
    private List<NoteChange> notes;
    @Schema(description = "标签变更列表")
    private List<TagChange> tags;

    @Data
    @Schema(name = "SyncFolderChange", description = "单个文件夹变更")
    public static class FolderChange {

        @Schema(description = "文件夹 ID", example = "folder-123")
        private String id;
        @Schema(description = "文件夹名称", example = "后端开发")
        private String name;
        @Schema(description = "文件夹图标标识", example = "pi pi-folder")
        private String icon;
        @Schema(description = "排序索引", example = "a0")
        private String rankIndex;
        @Schema(description = "是否已删除", example = "false")
        private Boolean isDeleted;
        @Schema(description = "版本号", example = "5")
        private Long version;
    }

    @Data
    @Schema(name = "SyncNoteChange", description = "单个笔记变更")
    public static class NoteChange {

        @Schema(description = "笔记 ID", example = "note-123")
        private String id;
        @Schema(description = "所属文件夹 ID", example = "folder-123")
        private String folderId;
        @Schema(description = "笔记标题", example = "JWT 登录实现记录")
        private String title;
        @Schema(description = "笔记正文内容", example = "# 登录流程\\n这里记录实现细节。")
        private String content;
        @Schema(description = "笔记主语言", example = "java")
        private String primaryLanguage;
        @Schema(description = "是否星标", example = "true")
        private Boolean isStarred;
        @Schema(description = "是否已删除", example = "false")
        private Boolean isDeleted;
        @Schema(description = "版本号", example = "8")
        private Long version;
        @Schema(description = "标签 ID 列表", example = "[\"tag-1\", \"tag-2\"]")
        private List<String> tagIds;
    }

    @Data
    @Schema(name = "SyncTagChange", description = "单个标签变更")
    public static class TagChange {

        @Schema(description = "标签 ID", example = "tag-1")
        private String id;
        @Schema(description = "标签名称", example = "Spring Boot")
        private String name;
        @Schema(description = "标签颜色", example = "#4F46E5")
        private String color;
        @Schema(description = "是否已删除", example = "false")
        private Boolean isDeleted;
        @Schema(description = "版本号", example = "4")
        private Long version;
    }
}
