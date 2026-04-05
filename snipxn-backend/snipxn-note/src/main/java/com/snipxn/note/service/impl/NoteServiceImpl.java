package com.snipxn.note.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snipxn.auth.entity.User;
import com.snipxn.auth.mapper.UserMapper;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.note.dto.req.CreateNoteRequest;
import com.snipxn.note.dto.req.UpdateNoteRequest;
import com.snipxn.note.dto.resp.NoteDetailResponse;
import com.snipxn.note.dto.resp.NoteListItemResponse;
import com.snipxn.note.dto.resp.PublicNoteResponse;
import com.snipxn.note.dto.resp.ShareNoteResponse;
import com.snipxn.note.dto.resp.StorageBreakdownResponse;
import com.snipxn.note.entity.DeletedRecord;
import com.snipxn.note.entity.Folder;
import com.snipxn.note.entity.Note;
import com.snipxn.note.entity.NoteShare;
import com.snipxn.note.entity.NoteTag;
import com.snipxn.note.entity.Tag;
import com.snipxn.note.entity.UserFile;
import com.snipxn.note.mapper.DeletedRecordMapper;
import com.snipxn.note.mapper.FolderMapper;
import com.snipxn.note.mapper.NoteMapper;
import com.snipxn.note.mapper.NoteShareMapper;
import com.snipxn.note.mapper.NoteTagMapper;
import com.snipxn.note.mapper.TagMapper;
import com.snipxn.note.mapper.UserFileMapper;
import com.snipxn.note.service.NoteService;
import com.snipxn.note.util.MarkdownUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteServiceImpl implements NoteService {

    private final NoteMapper noteMapper;
    private final NoteShareMapper noteShareMapper;
    private final NoteTagMapper noteTagMapper;
    private final FolderMapper folderMapper;
    private final TagMapper tagMapper;
    private final DeletedRecordMapper deletedRecordMapper;
    private final UserMapper userMapper;
    private final UserFileMapper userFileMapper;

    @Override
    public IPage<NoteListItemResponse> listNotes(String userId, String folderId, int page, int size) {
        if (StringUtils.hasText(folderId)) {
            ensureFolderOwned(userId, folderId);
        }
        long current = normalizePage(page);
        long pageSize = normalizeSize(size);
        long offset = (current - 1) * pageSize;
        List<Note> notes = noteMapper.selectActivePage(userId, folderId, pageSize, offset);
        long total = noteMapper.countActive(userId, folderId);
        return buildPage(current, pageSize, total, toListItemResponses(notes));
    }

    @Override
    public IPage<NoteListItemResponse> listStarred(String userId, int page, int size) {
        long current = normalizePage(page);
        long pageSize = normalizeSize(size);
        long offset = (current - 1) * pageSize;
        List<Note> notes = noteMapper.selectStarredPage(userId, pageSize, offset);
        long total = noteMapper.countStarred(userId);
        return buildPage(current, pageSize, total, toListItemResponses(notes));
    }

    @Override
    public IPage<NoteListItemResponse> listTrash(String userId, int page, int size) {
        long current = normalizePage(page);
        long pageSize = normalizeSize(size);
        long offset = (current - 1) * pageSize;
        List<Note> notes = noteMapper.selectTrashPage(userId, pageSize, offset);
        long total = noteMapper.countTrash(userId);
        return buildPage(current, pageSize, total, toListItemResponses(notes));
    }

    @Override
    public NoteDetailResponse getNote(String userId, String noteId) {
        Note note = noteMapper.selectAnyById(noteId);
        if (note == null || !userId.equals(note.getUserId())) {
            throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
        }
        return toDetailResponse(note);
    }

    @Override
    @Transactional
    public NoteDetailResponse createNote(String userId, CreateNoteRequest req) {
        String targetFolderId = resolveTargetFolderId(userId, req.getFolderId());
        List<String> tagIds = validateOwnedTagIds(userId, req.getTagIds());

        String content = req.getContent() == null ? "" : req.getContent();
        long contentBytes = countContentBytes(content);
        checkStorageQuota(userId, contentBytes);

        Note note = new Note();
        note.setUserId(userId);
        note.setFolderId(targetFolderId);
        note.setTitle(StringUtils.hasText(req.getTitle()) ? req.getTitle() : "无标题笔记");
        note.setContent(content);
        note.setSummary(MarkdownUtils.buildSummary(content));
        note.setPrimaryLanguage(req.getPrimaryLanguage());
        note.setIsStarred(false);
        note.setStatus("NORMAL");
        note.setLastDeviceId(req.getDeviceId());
        note.setIsDeleted(false);
        note.setVersion(1L);
        noteMapper.insert(note);

        addStorageUsed(userId, contentBytes);

        if (!tagIds.isEmpty()) {
            noteTagMapper.insertBatch(note.getId(), tagIds);
        }
        return toDetailResponse(note, tagIds);
    }

    @Override
    @Transactional
    public void updateNote(String userId, String noteId, UpdateNoteRequest req) {
        Note note = getOwnedActiveNote(userId, noteId);
        if (req.getVersion() == null || !req.getVersion().equals(note.getVersion())) {
            throw new BusinessException(ErrorCode.SYNC_VERSION_CONFLICT);
        }

        if (req.getFolderId() != null) {
            ensureFolderOwned(userId, req.getFolderId());
        }
        List<String> tagIds = req.getTagIds() == null ? null : validateOwnedTagIds(userId, req.getTagIds());

        // Calculate storage delta if content changed
        long storageDelta = 0;
        if (req.getContent() != null) {
            long oldBytes = countContentBytes(note.getContent());
            long newBytes = countContentBytes(req.getContent());
            storageDelta = newBytes - oldBytes;
            if (storageDelta > 0) {
                checkStorageQuota(userId, storageDelta);
            }
        }

        LambdaUpdateWrapper<Note> update = new LambdaUpdateWrapper<Note>()
                .eq(Note::getId, noteId)
                .eq(Note::getUserId, userId)
                .eq(Note::getVersion, req.getVersion());

        boolean changed = false;
        if (req.getFolderId() != null) {
            update.set(Note::getFolderId, req.getFolderId());
            changed = true;
        }
        if (req.getTitle() != null) {
            update.set(Note::getTitle, req.getTitle());
            changed = true;
        }
        if (req.getContent() != null) {
            update.set(Note::getContent, req.getContent());
            update.set(Note::getSummary, MarkdownUtils.buildSummary(req.getContent()));
            changed = true;
        }
        if (req.getPrimaryLanguage() != null) {
            update.set(Note::getPrimaryLanguage, req.getPrimaryLanguage());
            changed = true;
        }
        if (req.getIsStarred() != null) {
            update.set(Note::getIsStarred, req.getIsStarred());
            changed = true;
        }
        if (req.getDeviceId() != null) {
            update.set(Note::getLastDeviceId, req.getDeviceId());
            changed = true;
        }

        if (changed || tagIds != null) {
            update.setSql("updated_at = NOW(), version = version + 1");
            int updated = noteMapper.update(null, update);
            if (updated == 0) {
                throw new BusinessException(ErrorCode.SYNC_VERSION_CONFLICT);
            }
        }

        if (storageDelta != 0) {
            addStorageUsed(userId, storageDelta);
        }

        if (tagIds != null) {
            noteTagMapper.deleteByNoteId(noteId);
            if (!tagIds.isEmpty()) {
                noteTagMapper.insertBatch(noteId, tagIds);
            }
        }
    }

    @Override
    @Transactional
    public void deleteNote(String userId, String noteId) {
        getOwnedActiveNote(userId, noteId);
        int updated = noteMapper.update(null, new LambdaUpdateWrapper<Note>()
                .eq(Note::getId, noteId)
                .eq(Note::getUserId, userId)
                .set(Note::getIsDeleted, true)
                .setSql("updated_at = NOW(), version = version + 1"));
        if (updated == 0) {
            throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
        }
        insertDeletedRecord(userId, "notes", noteId);
    }

    @Override
    @Transactional
    public void restoreNote(String userId, String noteId) {
        Note note = noteMapper.selectAnyById(noteId);
        if (note == null || !userId.equals(note.getUserId())) {
            throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
        }
        if (!Boolean.TRUE.equals(note.getIsDeleted())) {
            return;
        }
        int updated = noteMapper.restoreDeletedNote(userId, noteId);
        if (updated == 0) {
            throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
        }
    }

    @Override
    @Transactional
    public void permanentDeleteNote(String userId, String noteId) {
        Note note = noteMapper.selectAnyById(noteId);
        if (note == null || !userId.equals(note.getUserId()) || !Boolean.TRUE.equals(note.getIsDeleted())) {
            throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
        }
        long contentBytes = countContentBytes(note.getContent());
        noteTagMapper.deleteByNoteId(noteId);
        int deleted = noteMapper.deletePermanentlyDeletedNote(userId, noteId);
        if (deleted == 0) {
            throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
        }
        if (contentBytes > 0) {
            addStorageUsed(userId, -contentBytes);
        }
    }

    @Override
    @Transactional
    public List<NoteDetailResponse> importNotes(String userId, List<MultipartFile> files, String folderId) {
        if (files == null || files.isEmpty()) {
            throw new BusinessException(ErrorCode.IMPORT_FILE_EMPTY);
        }
        if (files.size() > 20) {
            throw new BusinessException(ErrorCode.IMPORT_FILE_TOO_MANY);
        }

        for (MultipartFile file : files) {
            String originalName = file.getOriginalFilename();
            if (originalName == null || !originalName.toLowerCase().endsWith(".md")) {
                throw new BusinessException(ErrorCode.IMPORT_FILE_TYPE_INVALID);
            }
            if (file.getSize() > 2 * 1024 * 1024) {
                throw new BusinessException(ErrorCode.IMPORT_FILE_TOO_LARGE);
            }
        }

        String targetFolderId;
        if (StringUtils.hasText(folderId)) {
            ensureFolderOwned(userId, folderId);
            targetFolderId = folderId;
        } else {
            Folder defaultFolder = folderMapper.selectOne(new LambdaQueryWrapper<Folder>()
                    .eq(Folder::getUserId, userId)
                    .eq(Folder::getIsDefault, true)
                    .last("LIMIT 1"));
            if (defaultFolder == null) {
                throw new BusinessException(ErrorCode.FOLDER_NOT_FOUND);
            }
            targetFolderId = defaultFolder.getId();
        }

        // Pre-read all file contents and calculate total storage needed
        List<String[]> fileContents = new ArrayList<>(); // [title, content]
        long totalBytes = 0;
        for (MultipartFile file : files) {
            String originalName = file.getOriginalFilename();
            String title = originalName.substring(0, originalName.length() - 3);
            String content;
            try {
                content = new String(file.getBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR);
            }
            fileContents.add(new String[]{title, content});
            totalBytes += countContentBytes(content);
        }
        checkStorageQuota(userId, totalBytes);

        List<NoteDetailResponse> results = new ArrayList<>();
        for (String[] fc : fileContents) {
            Note note = new Note();
            note.setUserId(userId);
            note.setFolderId(targetFolderId);
            note.setTitle(StringUtils.hasText(fc[0]) ? fc[0] : "无标题笔记");
            note.setContent(fc[1]);
            note.setSummary(MarkdownUtils.buildSummary(fc[1]));
            note.setPrimaryLanguage("Markdown");
            note.setIsStarred(false);
            note.setStatus("NORMAL");
            note.setIsDeleted(false);
            note.setVersion(1L);
            noteMapper.insert(note);

            results.add(toDetailResponse(note, List.of()));
        }

        addStorageUsed(userId, totalBytes);
        return results;
    }

    @Override
    public ShareNoteResponse shareNote(String userId, String noteId) {
        getOwnedActiveNote(userId, noteId);

        NoteShare existing = noteShareMapper.selectByNoteIdAndUserId(noteId, userId);
        if (existing != null) {
            ShareNoteResponse response = new ShareNoteResponse();
            response.setShareToken(existing.getShareToken());
            return response;
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        NoteShare share = new NoteShare();
        share.setNoteId(noteId);
        share.setUserId(userId);
        share.setShareToken(token);
        noteShareMapper.insert(share);

        ShareNoteResponse response = new ShareNoteResponse();
        response.setShareToken(token);
        return response;
    }

    @Override
    public ShareNoteResponse checkShareStatus(String userId, String noteId) {
        getOwnedActiveNote(userId, noteId);
        NoteShare existing = noteShareMapper.selectByNoteIdAndUserId(noteId, userId);
        if (existing == null) {
            return null;
        }
        ShareNoteResponse response = new ShareNoteResponse();
        response.setShareToken(existing.getShareToken());
        return response;
    }

    @Override
    public void cancelShare(String userId, String noteId) {
        getOwnedActiveNote(userId, noteId);
        NoteShare existing = noteShareMapper.selectByNoteIdAndUserId(noteId, userId);
        if (existing != null) {
            noteShareMapper.deleteById(existing.getId());
        }
    }

    @Override
    public StorageBreakdownResponse getStorageBreakdown(String userId) {
        User user = userMapper.selectById(userId);

        long noteBytes = noteMapper.sumContentBytes(userId);
        long deletedBytes = noteMapper.sumDeletedContentBytes(userId);
        long imageBytes = userFileMapper.sumFileBytes(userId);
        int noteCount = (int) noteMapper.countActive(userId, null);
        int imageCount = Math.toIntExact(userFileMapper.selectCount(
                new LambdaQueryWrapper<UserFile>().eq(UserFile::getUserId, userId)));

        StorageBreakdownResponse response = new StorageBreakdownResponse();
        response.setTotalLimit(user.getStorageLimit() == null ? 0L : user.getStorageLimit());
        response.setTotalUsed(user.getStorageUsed() == null ? 0L : user.getStorageUsed());
        response.setNoteBytes(noteBytes);
        response.setImageBytes(imageBytes);
        response.setDeletedBytes(deletedBytes);
        response.setNoteCount(noteCount);
        response.setImageCount(imageCount);
        return response;
    }

    @Override
    public PublicNoteResponse getPublicNote(String shareToken) {
        NoteShare share = noteShareMapper.selectByShareToken(shareToken);
        if (share == null) {
            throw new BusinessException(ErrorCode.SHARE_NOT_FOUND);
        }

        Note note = noteMapper.selectById(share.getNoteId());
        if (note == null || Boolean.TRUE.equals(note.getIsDeleted())) {
            throw new BusinessException(ErrorCode.SHARE_NOT_FOUND);
        }

        PublicNoteResponse response = new PublicNoteResponse();
        response.setTitle(note.getTitle());
        response.setContent(note.getContent());
        response.setPrimaryLanguage(note.getPrimaryLanguage());
        response.setCreatedAt(note.getCreatedAt());
        response.setUpdatedAt(note.getUpdatedAt());
        return response;
    }

    private Note getOwnedActiveNote(String userId, String noteId) {
        Note note = noteMapper.selectById(noteId);
        if (note == null || !userId.equals(note.getUserId()) || Boolean.TRUE.equals(note.getIsDeleted())) {
            throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
        }
        return note;
    }

    private void ensureFolderOwned(String userId, String folderId) {
        Folder folder = folderMapper.selectById(folderId);
        if (folder == null || !userId.equals(folder.getUserId())) {
            throw new BusinessException(ErrorCode.FOLDER_NOT_FOUND);
        }
    }

    private String resolveTargetFolderId(String userId, String folderId) {
        if (StringUtils.hasText(folderId)) {
            ensureFolderOwned(userId, folderId);
            return folderId;
        }

        Folder defaultFolder = folderMapper.selectOne(new LambdaQueryWrapper<Folder>()
                .eq(Folder::getUserId, userId)
                .eq(Folder::getIsDefault, true)
                .last("LIMIT 1"));
        if (defaultFolder == null) {
            throw new BusinessException(ErrorCode.FOLDER_NOT_FOUND, "默认文件夹不存在");
        }
        return defaultFolder.getId();
    }

    private List<String> validateOwnedTagIds(String userId, List<String> tagIds) {
        List<String> normalized = normalizeTagIds(tagIds);
        if (normalized.isEmpty()) {
            return List.of();
        }

        long count = tagMapper.selectCount(new LambdaQueryWrapper<Tag>()
                .eq(Tag::getUserId, userId)
                .in(Tag::getId, normalized));
        if (count != normalized.size()) {
            throw new BusinessException(ErrorCode.TAG_NOT_FOUND);
        }
        return normalized;
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

    private List<NoteListItemResponse> toListItemResponses(List<Note> notes) {
        Map<String, List<String>> tagIdsByNoteId = getTagIdsByNoteId(notes);
        return notes.stream()
                .map(note -> toListItemResponse(note, tagIdsByNoteId))
                .toList();
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

    private NoteListItemResponse toListItemResponse(Note note, Map<String, List<String>> tagIdsByNoteId) {
        NoteListItemResponse response = new NoteListItemResponse();
        response.setId(note.getId());
        response.setFolderId(note.getFolderId());
        response.setTitle(note.getTitle());
        response.setSummary(note.getSummary());
        response.setPrimaryLanguage(note.getPrimaryLanguage());
        response.setIsStarred(note.getIsStarred());
        response.setTagIds(tagIdsByNoteId.getOrDefault(note.getId(), List.of()));
        response.setVersion(note.getVersion());
        response.setCharacterCount(countReadableCharacters(note.getContent()));
        response.setDocumentSizeBytes(countContentBytes(note.getContent()));
        response.setCreatedAt(note.getCreatedAt());
        response.setUpdatedAt(note.getUpdatedAt());
        return response;
    }

    private Integer countReadableCharacters(String content) {
        if (!StringUtils.hasText(content)) {
            return 0;
        }
        return (int) content.chars()
                .filter(ch -> !Character.isWhitespace(ch))
                .count();
    }

    private Long countContentBytes(String content) {
        if (!StringUtils.hasText(content)) {
            return 0L;
        }
        return (long) content.getBytes(StandardCharsets.UTF_8).length;
    }

    private void checkStorageQuota(String userId, long additionalBytes) {
        if (additionalBytes <= 0) {
            return;
        }
        User user = userMapper.selectById(userId);
        long used = user.getStorageUsed() == null ? 0L : user.getStorageUsed();
        long limit = user.getStorageLimit() == null ? 0L : user.getStorageLimit();
        if (used + additionalBytes > limit) {
            throw new BusinessException(ErrorCode.STORAGE_LIMIT_EXCEEDED);
        }
    }

    private void addStorageUsed(String userId, long deltaBytes) {
        if (deltaBytes == 0) {
            return;
        }
        userMapper.addStorageUsed(userId, deltaBytes);
    }

    private NoteDetailResponse toDetailResponse(Note note) {
        return toDetailResponse(note, noteTagMapper.selectTagIdsByNoteId(note.getId()));
    }

    private NoteDetailResponse toDetailResponse(Note note, List<String> tagIds) {
        NoteDetailResponse response = new NoteDetailResponse();
        response.setId(note.getId());
        response.setFolderId(note.getFolderId());
        response.setTitle(note.getTitle());
        response.setContent(note.getContent());
        response.setSummary(note.getSummary());
        response.setPrimaryLanguage(note.getPrimaryLanguage());
        response.setIsStarred(note.getIsStarred());
        response.setStatus(note.getStatus());
        response.setTagIds(tagIds == null ? List.of() : tagIds);
        response.setVersion(note.getVersion());
        response.setLastDeviceId(note.getLastDeviceId());
        response.setCreatedAt(note.getCreatedAt());
        response.setUpdatedAt(note.getUpdatedAt());
        return response;
    }

    private IPage<NoteListItemResponse> buildPage(long current, long size, long total, List<NoteListItemResponse> records) {
        Page<NoteListItemResponse> page = new Page<>(current, size, total);
        page.setRecords(records);
        return page;
    }

    private long normalizePage(int page) {
        return Math.max(page, 1);
    }

    private long normalizeSize(int size) {
        return size > 0 ? size : 20;
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
