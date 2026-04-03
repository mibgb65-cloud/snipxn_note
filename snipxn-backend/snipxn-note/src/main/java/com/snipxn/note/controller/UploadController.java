package com.snipxn.note.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.result.Result;
import com.snipxn.note.dto.resp.UploadResponse;
import com.snipxn.note.entity.UserFile;
import com.snipxn.note.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Tag(name = "文件", description = "文件上传与文件内容访问接口")
public class UploadController {

    private final FileService fileService;

    @Operation(summary = "上传文件", description = "上传成功后返回 fileId 与可访问 URL")
    @SecurityRequirement(name = "Bearer Token")
    @PostMapping
    public Result<UploadResponse> upload(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                         @Parameter(description = "待上传的文件") @RequestParam("file") MultipartFile file) {
        return Result.success(fileService.upload(userDetails.getUserId(), file));
    }

    @Operation(summary = "获取文件二进制内容", description = "公开访问上传后的文件内容，常用于头像或图片回显")
    @ApiResponse(
            responseCode = "200",
            description = "文件二进制流",
            content = @Content(schema = @Schema(type = "string", format = "binary"))
    )
    @GetMapping("/{fileId}")
    public ResponseEntity<byte[]> getFile(@Parameter(description = "文件 ID") @PathVariable String fileId) {
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
