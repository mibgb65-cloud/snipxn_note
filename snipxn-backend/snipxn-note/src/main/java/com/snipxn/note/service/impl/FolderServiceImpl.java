package com.snipxn.note.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.note.dto.req.CreateFolderRequest;
import com.snipxn.note.dto.req.UpdateFolderRequest;
import com.snipxn.note.dto.resp.FolderResponse;
import com.snipxn.note.entity.DeletedRecord;
import com.snipxn.note.entity.Folder;
import com.snipxn.note.mapper.DeletedRecordMapper;
import com.snipxn.note.mapper.FolderMapper;
import com.snipxn.note.mapper.NoteMapper;
import com.snipxn.note.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FolderServiceImpl implements FolderService {

    private final FolderMapper folderMapper;
    private final NoteMapper noteMapper;
    private final DeletedRecordMapper deletedRecordMapper;

    @Override
    public List<FolderResponse> listFolders(String userId) {
        List<Folder> folders = folderMapper.selectList(new LambdaQueryWrapper<Folder>()
                .eq(Folder::getUserId, userId)
                .orderByAsc(Folder::getRankIndex));
        Map<String, Integer> noteCountsByFolderId = getNoteCountsByFolderId(userId);

        return folders.stream()
                .map(folder -> toFolderResponse(folder, noteCountsByFolderId.getOrDefault(folder.getId(), 0)))
                .toList();
    }

    @Override
    @Transactional
    public FolderResponse createFolder(String userId, CreateFolderRequest req) {
        Folder folder = new Folder();
        folder.setUserId(userId);
        folder.setName(req.getName());
        folder.setIcon(StringUtils.hasText(req.getIcon()) ? req.getIcon() : "pi pi-folder");
        folder.setRankIndex(req.getRankIndex());
        folder.setIsDefault(false);
        folder.setIsDeleted(false);
        folder.setVersion(1L);
        folderMapper.insert(folder);
        return toFolderResponse(folder, 0);
    }

    @Override
    @Transactional
    public void updateFolder(String userId, String folderId, UpdateFolderRequest req) {
        getOwnedFolder(userId, folderId);

        LambdaUpdateWrapper<Folder> update = new LambdaUpdateWrapper<Folder>()
                .eq(Folder::getId, folderId)
                .eq(Folder::getUserId, userId)
                .eq(Folder::getVersion, req.getVersion());

        boolean changed = false;
        if (req.getName() != null) {
            update.set(Folder::getName, req.getName());
            changed = true;
        }
        if (req.getIcon() != null) {
            update.set(Folder::getIcon, req.getIcon());
            changed = true;
        }
        if (req.getRankIndex() != null) {
            update.set(Folder::getRankIndex, req.getRankIndex());
            changed = true;
        }

        if (!changed) {
            return;
        }

        update.setSql("updated_at = NOW(), version = version + 1");
        int updated = folderMapper.update(null, update);
        if (updated == 0) {
            throw new BusinessException(ErrorCode.SYNC_VERSION_CONFLICT);
        }
    }

    @Override
    @Transactional
    public void deleteFolder(String userId, String folderId) {
        Folder folder = getOwnedFolder(userId, folderId);
        if (Boolean.TRUE.equals(folder.getIsDefault())) {
            throw new BusinessException(ErrorCode.FOLDER_DEFAULT_DELETE);
        }

        Folder defaultFolder = getDefaultFolder(userId);
        noteMapper.moveNotesToFolder(userId, folderId, defaultFolder.getId());

        int updated = folderMapper.update(null, new LambdaUpdateWrapper<Folder>()
                .eq(Folder::getId, folderId)
                .eq(Folder::getUserId, userId)
                .set(Folder::getIsDeleted, true)
                .setSql("updated_at = NOW(), version = version + 1"));
        if (updated == 0) {
            throw new BusinessException(ErrorCode.FOLDER_NOT_FOUND);
        }

        insertDeletedRecord(userId, "folders", folderId);
    }

    @Override
    @Transactional
    public void initDefaultFolder(String userId) {
        Folder existing = folderMapper.selectOne(new LambdaQueryWrapper<Folder>()
                .eq(Folder::getUserId, userId)
                .eq(Folder::getIsDefault, true)
                .last("LIMIT 1"));
        if (existing != null) {
            return;
        }

        Folder folder = new Folder();
        folder.setUserId(userId);
        folder.setName("Inbox");
        folder.setIcon("pi pi-inbox");
        folder.setIsDefault(true);
        folder.setRankIndex("a");
        folder.setIsDeleted(false);
        folder.setVersion(1L);
        folderMapper.insert(folder);
    }

    private Folder getOwnedFolder(String userId, String folderId) {
        Folder folder = folderMapper.selectById(folderId);
        if (folder == null || !userId.equals(folder.getUserId())) {
            throw new BusinessException(ErrorCode.FOLDER_NOT_FOUND);
        }
        return folder;
    }

    private Folder getDefaultFolder(String userId) {
        Folder folder = folderMapper.selectOne(new LambdaQueryWrapper<Folder>()
                .eq(Folder::getUserId, userId)
                .eq(Folder::getIsDefault, true)
                .last("LIMIT 1"));
        if (folder == null) {
            throw new BusinessException(ErrorCode.FOLDER_NOT_FOUND, "默认文件夹不存在");
        }
        return folder;
    }

    private Map<String, Integer> getNoteCountsByFolderId(String userId) {
        Map<String, Integer> noteCountsByFolderId = new HashMap<>();
        for (Map<String, Object> row : noteMapper.countNotesByFolder(userId)) {
            Object folderId = row.get("folder_id");
            Object count = row.get("cnt");
            if (folderId != null && count instanceof Number) {
                noteCountsByFolderId.put(folderId.toString(), ((Number) count).intValue());
            }
        }
        return noteCountsByFolderId;
    }

    private FolderResponse toFolderResponse(Folder folder, int noteCount) {
        FolderResponse response = new FolderResponse();
        response.setId(folder.getId());
        response.setName(folder.getName());
        response.setIcon(folder.getIcon());
        response.setIsDefault(folder.getIsDefault());
        response.setRankIndex(folder.getRankIndex());
        response.setVersion(folder.getVersion());
        response.setNoteCount(noteCount);
        response.setCreatedAt(folder.getCreatedAt());
        response.setUpdatedAt(folder.getUpdatedAt());
        return response;
    }

    private void insertDeletedRecord(String userId, String tableName, String recordId) {
        DeletedRecord record = new DeletedRecord();
        record.setUserId(userId);
        record.setTableName(tableName);
        record.setRecordId(recordId);
        record.setDeletedAt(OffsetDateTime.now());
        deletedRecordMapper.insert(record);
    }
}
