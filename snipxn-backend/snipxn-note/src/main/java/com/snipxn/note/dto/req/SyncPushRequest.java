package com.snipxn.note.dto.req;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class SyncPushRequest {

    private String deviceId;
    private OffsetDateTime lastPulledAt;
    private List<FolderChange> folders;
    private List<NoteChange> notes;
    private List<TagChange> tags;

    @Data
    public static class FolderChange {

        private String id;
        private String name;
        private String icon;
        private String rankIndex;
        private Boolean isDeleted;
        private Long version;
    }

    @Data
    public static class NoteChange {

        private String id;
        private String folderId;
        private String title;
        private String content;
        private String primaryLanguage;
        private Boolean isStarred;
        private Boolean isDeleted;
        private Long version;
        private List<String> tagIds;
    }

    @Data
    public static class TagChange {

        private String id;
        private String name;
        private String color;
        private Boolean isDeleted;
        private Long version;
    }
}
