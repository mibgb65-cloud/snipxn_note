package com.snipxn.note.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.snipxn.auth.entity.User;
import com.snipxn.auth.mapper.UserMapper;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.note.dto.resp.UploadResponse;
import com.snipxn.note.entity.UserFile;
import com.snipxn.note.mapper.UserFileMapper;
import com.snipxn.note.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;

    private final UserFileMapper userFileMapper;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public UploadResponse upload(String userId, MultipartFile file) {
        String contentType = file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.FILE_TYPE_NOT_SUPPORTED);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "文件大小不能超过 5MB");
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }

        long used = user.getStorageUsed() == null ? 0L : user.getStorageUsed();
        long limit = user.getStorageLimit() == null ? 0L : user.getStorageLimit();
        long fileSize = file.getSize();
        if (used + fileSize > limit) {
            throw new BusinessException(ErrorCode.STORAGE_LIMIT_EXCEEDED);
        }

        UserFile userFile = new UserFile();
        userFile.setUserId(userId);
        userFile.setFileName(file.getOriginalFilename());
        userFile.setFileType(contentType);
        userFile.setFileSize(fileSize);
        userFile.setFileData(readBytes(file));
        userFile.setUploadedAt(OffsetDateTime.now());
        userFileMapper.insert(userFile);

        userMapper.update(null, new LambdaUpdateWrapper<User>()
                .eq(User::getId, userId)
                .set(User::getStorageUsed, used + fileSize));

        UploadResponse response = new UploadResponse();
        response.setFileId(userFile.getId());
        response.setUrl("/api/v1/files/" + userFile.getId());
        response.setFileSize(fileSize);
        return response;
    }

    @Override
    public UserFile getFile(String fileId) {
        UserFile userFile = userFileMapper.selectById(fileId);
        if (userFile == null) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        return userFile;
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "读取上传文件失败");
        }
    }
}
