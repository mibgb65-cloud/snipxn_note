package com.snipxn.note.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.Result;
import com.snipxn.note.dto.resp.UploadResponse;
import com.snipxn.note.entity.UserFile;
import com.snipxn.note.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class UploadController {

    private final FileService fileService;

    @PostMapping
    public Result<UploadResponse> upload(@AuthenticationPrincipal CustomUserDetails userDetails,
                                         @RequestParam("file") MultipartFile file) {
        return Result.success(fileService.upload(userDetails.getUserId(), file));
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<byte[]> getFile(@PathVariable String fileId) {
        UserFile userFile = fileService.getFile(fileId);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (userFile.getFileType() != null) {
            mediaType = MediaType.parseMediaType(userFile.getFileType());
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(userFile.getFileSize() == null ? userFile.getFileData().length : userFile.getFileSize())
                .body(userFile.getFileData());
    }
}
