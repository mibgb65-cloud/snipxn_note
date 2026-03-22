package com.snipxn.note.service;

import com.snipxn.note.dto.req.CreateFolderRequest;
import com.snipxn.note.dto.req.UpdateFolderRequest;
import com.snipxn.note.dto.resp.FolderResponse;

import java.util.List;

public interface FolderService {

    List<FolderResponse> listFolders(String userId);

    FolderResponse createFolder(String userId, CreateFolderRequest req);

    void updateFolder(String userId, String folderId, UpdateFolderRequest req);

    void deleteFolder(String userId, String folderId);

    /** 注册时自动调用，创建默认 "Inbox" 文件夹 */
    void initDefaultFolder(String userId);
}
