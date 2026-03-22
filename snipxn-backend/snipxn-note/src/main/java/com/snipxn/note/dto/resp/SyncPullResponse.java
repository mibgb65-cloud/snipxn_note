package com.snipxn.note.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class SyncPullResponse {

    private OffsetDateTime serverTime;
    private List<FolderResponse> folders;
    private List<NoteDetailResponse> notes;
    private List<TagResp> tags;
    private List<DeletedItem> deletedItems;

    @Data
    public static class TagResp {

        private String id;
        private String name;
        private String color;
        private Long version;
        private OffsetDateTime updatedAt;
    }

    @Data
    public static class DeletedItem {

        private String tableName;
        private String recordId;
        private OffsetDateTime deletedAt;
    }
}
