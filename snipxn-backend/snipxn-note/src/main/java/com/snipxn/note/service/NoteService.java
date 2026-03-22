package com.snipxn.note.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.snipxn.note.dto.req.CreateNoteRequest;
import com.snipxn.note.dto.req.UpdateNoteRequest;
import com.snipxn.note.dto.resp.NoteDetailResponse;
import com.snipxn.note.dto.resp.NoteListItemResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface NoteService {

    IPage<NoteListItemResponse> listNotes(String userId, String folderId, int page, int size);

    IPage<NoteListItemResponse> listStarred(String userId, int page, int size);

    IPage<NoteListItemResponse> listTrash(String userId, int page, int size);

    NoteDetailResponse getNote(String userId, String noteId);

    NoteDetailResponse createNote(String userId, CreateNoteRequest req);

    void updateNote(String userId, String noteId, UpdateNoteRequest req);

    void deleteNote(String userId, String noteId);

    void restoreNote(String userId, String noteId);

    void permanentDeleteNote(String userId, String noteId);

    List<NoteDetailResponse> importNotes(String userId, List<MultipartFile> files, String folderId);
}
