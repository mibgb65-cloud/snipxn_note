package com.snipxn.note.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snipxn.note.entity.Note;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public interface NoteMapper extends BaseMapper<Note> {

    @Select({
            "<script>",
            "SELECT * FROM notes",
            "WHERE user_id = #{userId}",
            "AND is_deleted = FALSE",
            "<if test='folderId != null and folderId != \"\"'>AND folder_id = #{folderId}</if>",
            "ORDER BY updated_at DESC",
            "LIMIT #{limit} OFFSET #{offset}",
            "</script>"
    })
    List<Note> selectActivePage(@Param("userId") String userId,
                                @Param("folderId") String folderId,
                                @Param("limit") long limit,
                                @Param("offset") long offset);

    @Select({
            "<script>",
            "SELECT COUNT(*) FROM notes",
            "WHERE user_id = #{userId}",
            "AND is_deleted = FALSE",
            "<if test='folderId != null and folderId != \"\"'>AND folder_id = #{folderId}</if>",
            "</script>"
    })
    long countActive(@Param("userId") String userId, @Param("folderId") String folderId);

    @Select("""
            SELECT * FROM notes
            WHERE user_id = #{userId}
              AND is_deleted = FALSE
              AND is_starred = TRUE
            ORDER BY updated_at DESC
            LIMIT #{limit} OFFSET #{offset}
            """)
    List<Note> selectStarredPage(@Param("userId") String userId,
                                 @Param("limit") long limit,
                                 @Param("offset") long offset);

    @Select("""
            SELECT COUNT(*) FROM notes
            WHERE user_id = #{userId}
              AND is_deleted = FALSE
              AND is_starred = TRUE
            """)
    long countStarred(@Param("userId") String userId);

    @Select("""
            SELECT * FROM notes
            WHERE user_id = #{userId}
              AND is_deleted = TRUE
            ORDER BY updated_at DESC
            LIMIT #{limit} OFFSET #{offset}
            """)
    List<Note> selectTrashPage(@Param("userId") String userId,
                               @Param("limit") long limit,
                               @Param("offset") long offset);

    @Select("""
            SELECT COUNT(*) FROM notes
            WHERE user_id = #{userId}
              AND is_deleted = TRUE
            """)
    long countTrash(@Param("userId") String userId);

    @Select("""
            SELECT folder_id, COUNT(*) AS cnt FROM notes
            WHERE user_id = #{userId} AND is_deleted = FALSE
            GROUP BY folder_id
            """)
    List<Map<String, Object>> countNotesByFolder(@Param("userId") String userId);

    @Select("SELECT * FROM notes WHERE id = #{id}")
    Note selectAnyById(@Param("id") String id);

    @Update("""
            UPDATE notes
            SET folder_id = #{targetFolderId},
                updated_at = NOW(),
                version = version + 1
            WHERE folder_id = #{sourceFolderId}
              AND user_id = #{userId}
            """)
    int moveNotesToFolder(@Param("userId") String userId,
                          @Param("sourceFolderId") String sourceFolderId,
                          @Param("targetFolderId") String targetFolderId);

    @Update("""
            UPDATE notes
            SET is_deleted = FALSE,
                updated_at = NOW(),
                version = version + 1
            WHERE id = #{noteId}
              AND user_id = #{userId}
              AND is_deleted = TRUE
            """)
    int restoreDeletedNote(@Param("userId") String userId, @Param("noteId") String noteId);

    @Delete("""
            DELETE FROM notes
            WHERE id = #{noteId}
              AND user_id = #{userId}
              AND is_deleted = TRUE
            """)
    int deletePermanentlyDeletedNote(@Param("userId") String userId, @Param("noteId") String noteId);

    @Select({
            "<script>",
            "SELECT * FROM notes",
            "WHERE user_id = #{userId}",
            "<if test='lastPulledAt != null'>AND updated_at &gt; #{lastPulledAt}</if>",
            "ORDER BY updated_at ASC",
            "</script>"
    })
    List<Note> selectForSync(@Param("userId") String userId,
                             @Param("lastPulledAt") OffsetDateTime lastPulledAt);
}
