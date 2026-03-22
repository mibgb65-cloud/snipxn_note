package com.snipxn.note.mapper;

import com.snipxn.note.entity.NoteTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface NoteTagMapper {

    @Select("SELECT tag_id FROM note_tags WHERE note_id = #{noteId}")
    List<String> selectTagIdsByNoteId(@Param("noteId") String noteId);

    @Select({
            "<script>",
            "SELECT note_id, tag_id FROM note_tags WHERE note_id IN",
            "<foreach collection='noteIds' item='id' open='(' separator=',' close=')'>#{id}</foreach>",
            "</script>"
    })
    List<NoteTag> selectByNoteIds(@Param("noteIds") List<String> noteIds);

    @Delete("DELETE FROM note_tags WHERE note_id = #{noteId}")
    int deleteByNoteId(@Param("noteId") String noteId);

    @Delete("DELETE FROM note_tags WHERE tag_id = #{tagId}")
    int deleteByTagId(@Param("tagId") String tagId);

    @Insert({
            "<script>",
            "INSERT INTO note_tags (note_id, tag_id) VALUES",
            "<foreach collection='tagIds' item='tagId' separator=','>",
            "(#{noteId}, #{tagId})",
            "</foreach>",
            "</script>"
    })
    int insertBatch(@Param("noteId") String noteId, @Param("tagIds") List<String> tagIds);
}
