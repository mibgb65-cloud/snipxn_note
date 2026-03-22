package com.snipxn.note.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.note.dto.resp.SyncPullResponse;
import com.snipxn.note.entity.DeletedRecord;
import com.snipxn.note.entity.Tag;
import com.snipxn.note.mapper.DeletedRecordMapper;
import com.snipxn.note.mapper.NoteTagMapper;
import com.snipxn.note.mapper.TagMapper;
import com.snipxn.note.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagMapper tagMapper;
    private final NoteTagMapper noteTagMapper;
    private final DeletedRecordMapper deletedRecordMapper;

    @Override
    public List<SyncPullResponse.TagResp> listTags(String userId) {
        List<Tag> tags = tagMapper.selectList(new LambdaQueryWrapper<Tag>()
                .eq(Tag::getUserId, userId)
                .orderByAsc(Tag::getName));
        return tags.stream().map(this::toTagResp).toList();
    }

    @Override
    @Transactional
    public SyncPullResponse.TagResp createTag(String userId, String name, String color) {
        ensureTagNameAvailable(userId, null, name);

        Tag tag = new Tag();
        tag.setUserId(userId);
        tag.setName(name);
        tag.setColor(color);
        tag.setIsDeleted(false);
        tag.setVersion(1L);
        tagMapper.insert(tag);
        return toTagResp(tag);
    }

    @Override
    @Transactional
    public void updateTag(String userId, String tagId, String name, String color) {
        Tag tag = getOwnedTag(userId, tagId);
        if (name != null && !name.equals(tag.getName())) {
            ensureTagNameAvailable(userId, tagId, name);
        }

        LambdaUpdateWrapper<Tag> update = new LambdaUpdateWrapper<Tag>()
                .eq(Tag::getId, tagId)
                .eq(Tag::getUserId, userId);

        boolean changed = false;
        if (name != null) {
            update.set(Tag::getName, name);
            changed = true;
        }
        if (color != null) {
            update.set(Tag::getColor, color);
            changed = true;
        }
        if (!changed) {
            return;
        }

        update.setSql("updated_at = NOW(), version = version + 1");
        int updated = tagMapper.update(null, update);
        if (updated == 0) {
            throw new BusinessException(ErrorCode.TAG_NOT_FOUND);
        }
    }

    @Override
    @Transactional
    public void deleteTag(String userId, String tagId) {
        getOwnedTag(userId, tagId);
        noteTagMapper.deleteByTagId(tagId);

        int updated = tagMapper.update(null, new LambdaUpdateWrapper<Tag>()
                .eq(Tag::getId, tagId)
                .eq(Tag::getUserId, userId)
                .set(Tag::getIsDeleted, true)
                .setSql("updated_at = NOW(), version = version + 1"));
        if (updated == 0) {
            throw new BusinessException(ErrorCode.TAG_NOT_FOUND);
        }

        DeletedRecord record = new DeletedRecord();
        record.setUserId(userId);
        record.setTableName("tags");
        record.setRecordId(tagId);
        record.setDeletedAt(OffsetDateTime.now());
        deletedRecordMapper.insert(record);
    }

    private Tag getOwnedTag(String userId, String tagId) {
        Tag tag = tagMapper.selectById(tagId);
        if (tag == null || !userId.equals(tag.getUserId())) {
            throw new BusinessException(ErrorCode.TAG_NOT_FOUND);
        }
        return tag;
    }

    private void ensureTagNameAvailable(String userId, String excludeTagId, String name) {
        LambdaQueryWrapper<Tag> query = new LambdaQueryWrapper<Tag>()
                .eq(Tag::getUserId, userId)
                .eq(Tag::getName, name);
        if (excludeTagId != null) {
            query.ne(Tag::getId, excludeTagId);
        }

        long count = tagMapper.selectCount(query);
        if (count > 0) {
            throw new BusinessException(ErrorCode.TAG_NAME_DUPLICATE);
        }
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
}
