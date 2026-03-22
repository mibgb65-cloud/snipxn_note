package com.snipxn.note.service;

import com.snipxn.note.dto.resp.UploadResponse;
import com.snipxn.note.entity.UserFile;
import org.springframework.web.multipart.MultipartFile;

public interface FileService {

    UploadResponse upload(String userId, MultipartFile file);

    UserFile getFile(String fileId);
}
