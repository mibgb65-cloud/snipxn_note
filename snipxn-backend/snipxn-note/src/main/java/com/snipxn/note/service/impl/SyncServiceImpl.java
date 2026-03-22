package com.snipxn.note.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.note.dto.req.SyncPushRequest;
import com.snipxn.note.dto.resp.FolderResponse;
import com.snipxn.note.dto.resp.NoteDetailResponse;
import com.snipxn.note.dto.resp.SyncPullResponse;
import com.snipxn.note.entity.DeletedRecord;
import com.snipxn.note.entity.Folder;
import com.snipxn.note.entity.Note;
import com.snipxn.note.entity.NoteTag;
import com.snipxn.note.entity.Tag;
import com.snipxn.note.mapper.DeletedRecordMapper;
import com.snipxn.note.mapper.FolderMapper;
import com.snipxn.note.mapper.NoteMapper;
import com.snipxn.note.mapper.NoteTagMapper;
import com.snipxn.note.mapper.TagMapper;
import com.snipxn.note.service.SyncService;
import com.snipxn.note.util.MarkdownUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SyncServiceImpl implements SyncService {

    private final FolderMapper folderMapper;
    private final NoteMapper noteMapper;
    private final TagMapper tagMapper;
    private final NoteTagMapper noteTagMapper;
    private final DeletedRecordMapper deletedRecordMapper;

    @Override
    public SyncPullResponse pull(String userId, OffsetDateTime lastPulledAt) {
        List<Folder> syncedFolders = folderMapper.selectForSync(userId, lastPulledAt).stream()
                .filter(folder -> !Boolean.TRUE.equals(folder.getIsDeleted()))
                .toList();
        Map<String, Integer> noteCountsByFolderId = getNoteCountsByFolderId(userId);
        List<FolderResponse> folders = syncedFolders.stream()
                .map(folder -> toFolderResponse(folder, noteCountsByFolderId))
                .toList();

        List<Note> syncedNotes = noteMapper.selectForSync(userId, lastPulledAt).stream()
                .filter(note -> !Boolean.TRUE.equals(note.getIsDeleted()))
                .toList();
        Map<String, List<String>> tagIdsByNoteId = getTagIdsByNoteId(syncedNotes);
        List<NoteDetailResponse> notes = syncedNotes.stream()
                .map(note -> toNoteDetailResponse(note, tagIdsByNoteId))
                .toList();

        List<SyncPullResponse.TagResp> tags = tagMapper.selectForSync(userId, lastPulledAt).stream()
                .filter(tag -> !Boolean.TRUE.equals(tag.getIsDeleted()))
                .map(this::toTagResp)
                .toList();

        LambdaQueryWrapper<DeletedRecord> deletedQuery = new LambdaQueryWrapper<DeletedRecord>()
                .eq(DeletedRecord::getUserId, userId);
        if (lastPulledAt != null) {
            deletedQuery.gt(DeletedRecord::getDeletedAt, lastPulledAt);
        }
        deletedQuery.orderByAsc(DeletedRecord::getDeletedAt);

        List<SyncPullResponse.DeletedItem> deletedItems = deletedRecordMapper.selectList(deletedQuery).stream()
                .map(this::toDeletedItem)
                .toList();

        SyncPullResponse response = new SyncPullResponse();
        response.setServerTime(OffsetDateTime.now());
        response.setFolders(folders);
        response.setNotes(notes);
        response.setTags(tags);
        response.setDeletedItems(deletedItems);
        return response;
    }

    @Override
    @Transactional
    public SyncPullResponse push(String userId, SyncPushRequest req) {
        if (req.getFolders() != null) {
            for (SyncPushRequest.FolderChange change : req.getFolders()) {
                applyFolderChange(userId, change);
            }
        }
        if (req.getNotes() != null) {
            for (SyncPushRequest.NoteChange change : req.getNotes()) {
                applyNoteChange(userId, req.getDeviceId(), change);
            }
        }
        if (req.getTags() != null) {
            for (SyncPushRequest.TagChange change : req.getTags()) {
                applyTagChange(userId, change);
            }
        }
        return pull(userId, req.getLastPulledAt());
    }

    private void applyFolderChange(String userId, SyncPushRequest.FolderChange change) {
        if (!StringUtils.hasText(change.getId())) {
            if (Boolean.TRUE.equals(change.getIsDeleted())) {
                return;
            }
            Folder folder = new Folder();
            folder.setUserId(userId);
            folder.setName(change.getName());
            folder.setIcon(StringUtils.hasText(change.getIcon()) ? change.getIcon() : "folder");
            folder.setRankIndex(change.getRankIndex());
            folder.setIsDefault(false);
            folder.setIsDeleted(false);
            folder.setVersion(1L);
            folderMapper.insert(folder);
            return;
        }

        Folder existing = folderMapper.selectAnyById(change.getId());
        if (existing == null || !userId.equals(existing.getUserId()) || change.getVersion() == null) {
            return;
        }
        if (!change.getVersion().equals(existing.getVersion())) {
            return;
        }
        if (Boolean.TRUE.equals(change.getIsDeleted())) {
            if (Boolean.TRUE.equals(existing.getIsDeleted()) || Boolean.TRUE.equals(existing.getIsDefault())) {
                return;
            }
            Folder defaultFolder = getDefaultFolder(userId);
            noteMapper.moveNotesToFolder(userId, existing.getId(), defaultFolder.getId());
            int updated = folderMapper.update(null, new LambdaUpdateWrapper<Folder>()
                    .eq(Folder::getId, existing.getId())
                    .eq(Folder::getUserId, userId)
                    .eq(Folder::getVersion, change.getVersion())
                    .set(Folder::getIsDeleted, true)
                    .setSql("updated_at = NOW(), version = version + 1"));
            if (updated > 0) {
                insertDeletedRecord(userId, "folders", existing.getId());
            }
            return;
        }

        if (Boolean.TRUE.equals(existing.getIsDeleted())) {
            return;
        }

        LambdaUpdateWrapper<Folder> update = new LambdaUpdateWrapper<Folder>()
                .eq(Folder::getId, existing.getId())
                .eq(Folder::getUserId, userId)
                .eq(Folder::getVersion, change.getVersion());

        boolean changed = false;
        if (change.getName() != null) {
            update.set(Folder::getName, change.getName());
            changed = true;
        }
        if (change.getIcon() != null) {
            update.set(Folder::getIcon, change.getIcon());
            changed = true;
        }
        if (change.getRankIndex() != null) {
            update.set(Folder::getRankIndex, change.getRankIndex());
            changed = true;
        }
        if (changed) {
            update.setSql("updated_at = NOW(), version = version + 1");
            folderMapper.update(null, update);
        }
    }

    private void applyNoteChange(String userId, String deviceId, SyncPushRequest.NoteChange change) {
        if (!StringUtils.hasText(change.getId())) {
            if (Boolean.TRUE.equals(change.getIsDeleted()) || !StringUtils.hasText(change.getFolderId())) {
                return;
            }
            if (!folderOwned(userId, change.getFolderId())) {
                return;
            }
            List<String> tagIds = validateOwnedTagIds(userId, change.getTagIds());
            if (tagIds == null) {
                return;
            }

            String content = change.getContent() == null ? "" : change.getContent();
            Note note = new Note();
            note.setUserId(userId);
            note.setFolderId(change.getFolderId());
            note.setTitle(StringUtils.hasText(change.getTitle()) ? change.getTitle() : "无标题笔记");
            note.setContent(content);
            note.setSummary(MarkdownUtils.buildSummary(content));
            note.setPrimaryLanguage(change.getPrimaryLanguage());
            note.setIsStarred(Boolean.TRUE.equals(change.getIsStarred()));
            note.setStatus("NORMAL");
            note.setLastDeviceId(deviceId);
            note.setIsDeleted(false);
            note.setVersion(1L);
            noteMapper.insert(note);
            if (!tagIds.isEmpty()) {
                noteTagMapper.insertBatch(note.getId(), tagIds);
            }
            return;
        }

        Note existing = noteMapper.selectAnyById(change.getId());
        if (existing == null || !userId.equals(existing.getUserId()) || change.getVersion() == null) {
            return;
        }
        if (!change.getVersion().equals(existing.getVersion())) {
            return;
        }

        if (Boolean.TRUE.equals(change.getIsDeleted())) {
            if (Boolean.TRUE.equals(existing.getIsDeleted())) {
                return;
            }
            int updated = noteMapper.update(null, new LambdaUpdateWrapper<Note>()
                    .eq(Note::getId, existing.getId())
                    .eq(Note::getUserId, userId)
                    .eq(Note::getVersion, change.getVersion())
                    .set(Note::getIsDeleted, true)
                    .setSql("updated_at = NOW(), version = version + 1"));
            if (updated > 0) {
                insertDeletedRecord(userId, "notes", existing.getId());
            }
            return;
        }

        if (Boolean.TRUE.equals(existing.getIsDeleted())) {
            return;
        }
        if (change.getFolderId() != null && !folderOwned(userId, change.getFolderId())) {
            return;
        }

        List<String> tagIds = change.getTagIds() == null ? null : validateOwnedTagIds(userId, change.getTagIds());
        if (change.getTagIds() != null && tagIds == null) {
            return;
        }

        LambdaUpdateWrapper<Note> update = new LambdaUpdateWrapper<Note>()
                .eq(Note::getId, existing.getId())
                .eq(Note::getUserId, userId)
                .eq(Note::getVersion, change.getVersion());

        boolean changed = false;
        if (change.getFolderId() != null) {
            update.set(Note::getFolderId, change.getFolderId());
            changed = true;
        }
        if (change.getTitle() != null) {
            update.set(Note::getTitle, change.getTitle());
            changed = true;
        }
        if (change.getContent() != null) {
            update.set(Note::getContent, change.getContent());
            update.set(Note::getSummary, MarkdownUtils.buildSummary(change.getContent()));
            changed = true;
        }
        if (change.getPrimaryLanguage() != null) {
            update.set(Note::getPrimaryLanguage, change.getPrimaryLanguage());
            changed = true;
        }
        if (change.getIsStarred() != null) {
            update.set(Note::getIsStarred, change.getIsStarred());
            changed = true;
        }
        update.set(Note::getLastDeviceId, deviceId);
        changed = true;

        if (changed || tagIds != null) {
            update.setSql("updated_at = NOW(), version = version + 1");
            int updated = noteMapper.update(null, update);
            if (updated > 0 && tagIds != null) {
                noteTagMapper.deleteByNoteId(existing.getId());
                if (!tagIds.isEmpty()) {
                    noteTagMapper.insertBatch(existing.getId(), tagIds);
                }
            }
        }
    }

    private void applyTagChange(String userId, SyncPushRequest.TagChange change) {
        if (!StringUtils.hasText(change.getId())) {
            if (Boolean.TRUE.equals(change.getIsDeleted()) || !StringUtils.hasText(change.getName())) {
                return;
            }
            if (tagNameExists(userId, null, change.getName())) {
                return;
            }
            Tag tag = new Tag();
            tag.setUserId(userId);
            tag.setName(change.getName());
            tag.setColor(change.getColor());
            tag.setIsDeleted(false);
            tag.setVersion(1L);
            tagMapper.insert(tag);
            return;
        }

        Tag existing = tagMapper.selectAnyById(change.getId());
        if (existing == null || !userId.equals(existing.getUserId()) || change.getVersion() == null) {
            return;
        }
        if (!change.getVersion().equals(existing.getVersion())) {
            return;
        }

        if (Boolean.TRUE.equals(change.getIsDeleted())) {
            if (Boolean.TRUE.equals(existing.getIsDeleted())) {
                return;
            }
            noteTagMapper.deleteByTagId(existing.getId());
            int updated = tagMapper.update(null, new LambdaUpdateWrapper<Tag>()
                    .eq(Tag::getId, existing.getId())
                    .eq(Tag::getUserId, userId)
                    .eq(Tag::getVersion, change.getVersion())
                    .set(Tag::getIsDeleted, true)
                    .setSql("updated_at = NOW(), version = version + 1"));
            if (updated > 0) {
                insertDeletedRecord(userId, "tags", existing.getId());
            }
            return;
        }

        if (Boolean.TRUE.equals(existing.getIsDeleted())) {
            return;
        }
        if (change.getName() != null && !change.getName().equals(existing.getName())
                && tagNameExists(userId, existing.getId(), change.getName())) {
            return;
        }

        LambdaUpdateWrapper<Tag> update = new LambdaUpdateWrapper<Tag>()
                .eq(Tag::getId, existing.getId())
                .eq(Tag::getUserId, userId)
                .eq(Tag::getVersion, change.getVersion());

        boolean changed = false;
        if (change.getName() != null) {
            update.set(Tag::getName, change.getName());
            changed = true;
        }
        if (change.getColor() != null) {
            update.set(Tag::getColor, change.getColor());
            changed = true;
        }
        if (changed) {
            update.setSql("updated_at = NOW(), version = version + 1");
            tagMapper.update(null, update);
        }
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

    private boolean folderOwned(String userId, String folderId) {
        Folder folder = folderMapper.selectById(folderId);
        return folder != null && userId.equals(folder.getUserId());
    }

    private List<String> validateOwnedTagIds(String userId, List<String> tagIds) {
        List<String> normalized = normalizeTagIds(tagIds);
        if (normalized.isEmpty()) {
            return List.of();
        }
        long count = tagMapper.selectCount(new LambdaQueryWrapper<Tag>()
                .eq(Tag::getUserId, userId)
                .in(Tag::getId, normalized));
        return count == normalized.size() ? normalized : null;
    }

    private List<String> normalizeTagIds(List<String> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return List.of();
        }

        Set<String> ids = new LinkedHashSet<>();
        for (String tagId : tagIds) {
            if (StringUtils.hasText(tagId)) {
                ids.add(tagId);
            }
        }
        return List.copyOf(ids);
    }

    private boolean tagNameExists(String userId, String excludeId, String name) {
        LambdaQueryWrapper<Tag> query = new LambdaQueryWrapper<Tag>()
                .eq(Tag::getUserId, userId)
                .eq(Tag::getName, name);
        if (excludeId != null) {
            query.ne(Tag::getId, excludeId);
        }
        return tagMapper.selectCount(query) > 0;
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

    private Map<String, List<String>> getTagIdsByNoteId(List<Note> notes) {
        if (notes.isEmpty()) {
            return Map.of();
        }
        List<String> noteIds = notes.stream()
                .map(Note::getId)
                .toList();
        return noteTagMapper.selectByNoteIds(noteIds).stream()
                .collect(Collectors.groupingBy(
                        NoteTag::getNoteId,
                        Collectors.mapping(NoteTag::getTagId, Collectors.toList())
                ));
    }

    private FolderResponse toFolderResponse(Folder folder, Map<String, Integer> noteCountsByFolderId) {
        FolderResponse response = new FolderResponse();
        response.setId(folder.getId());
        response.setName(folder.getName());
        response.setIcon(folder.getIcon());
        response.setIsDefault(folder.getIsDefault());
        response.setRankIndex(folder.getRankIndex());
        response.setVersion(folder.getVersion());
        response.setNoteCount(noteCountsByFolderId.getOrDefault(folder.getId(), 0));
        response.setCreatedAt(folder.getCreatedAt());
        response.setUpdatedAt(folder.getUpdatedAt());
        return response;
    }

    private NoteDetailResponse toNoteDetailResponse(Note note, Map<String, List<String>> tagIdsByNoteId) {
        NoteDetailResponse response = new NoteDetailResponse();
        response.setId(note.getId());
        response.setFolderId(note.getFolderId());
        response.setTitle(note.getTitle());
        response.setContent(note.getContent());
        response.setSummary(note.getSummary());
        response.setPrimaryLanguage(note.getPrimaryLanguage());
        response.setIsStarred(note.getIsStarred());
        response.setStatus(note.getStatus());
        response.setTagIds(tagIdsByNoteId.getOrDefault(note.getId(), List.of()));
        response.setVersion(note.getVersion());
        response.setLastDeviceId(note.getLastDeviceId());
        response.setCreatedAt(note.getCreatedAt());
        response.setUpdatedAt(note.getUpdatedAt());
        return response;
    }

    private SyncPullResponse.TagResp toTagResp(Tag tag) {
        SyncPullResponse.TagResp resp = new SyncPullResponse.TagResp();
        resp.setId(tag.getId());
        resp.setName(tag.getName());
        resp.setColor(tag.getColor());
        resp.setVersion(tag.getVersion());
        resp.setUpdatedAt(tag.getUpdatedAt());
        return resp;
    }

    private SyncPullResponse.DeletedItem toDeletedItem(DeletedRecord record) {
        SyncPullResponse.DeletedItem item = new SyncPullResponse.DeletedItem();
        item.setTableName(record.getTableName());
        item.setRecordId(record.getRecordId());
        item.setDeletedAt(record.getDeletedAt());
        return item;
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
