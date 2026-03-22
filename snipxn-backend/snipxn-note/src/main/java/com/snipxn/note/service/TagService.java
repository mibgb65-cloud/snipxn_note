package com.snipxn.note.service;

import com.snipxn.note.dto.resp.SyncPullResponse;

import java.util.List;

public interface TagService {

    List<SyncPullResponse.TagResp> listTags(String userId);

    SyncPullResponse.TagResp createTag(String userId, String name, String color);

    void updateTag(String userId, String tagId, String name, String color);

    void deleteTag(String userId, String tagId);
}
