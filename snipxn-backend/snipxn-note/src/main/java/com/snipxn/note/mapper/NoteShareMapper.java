package com.snipxn.note.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snipxn.note.entity.NoteShare;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface NoteShareMapper extends BaseMapper<NoteShare> {

    @Select("""
            SELECT * FROM note_shares
            WHERE share_token = #{shareToken}
            LIMIT 1
            """)
    NoteShare selectByShareToken(@Param("shareToken") String shareToken);

    @Select("""
            SELECT * FROM note_shares
            WHERE note_id = #{noteId}
              AND user_id = #{userId}
            LIMIT 1
            """)
    NoteShare selectByNoteIdAndUserId(@Param("noteId") String noteId,
                                      @Param("userId") String userId);
}
