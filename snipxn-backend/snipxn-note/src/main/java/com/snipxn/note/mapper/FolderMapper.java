package com.snipxn.note.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snipxn.note.entity.Folder;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.OffsetDateTime;
import java.util.List;

public interface FolderMapper extends BaseMapper<Folder> {

    @Select({
            "<script>",
            "SELECT * FROM folders",
            "WHERE user_id = #{userId}",
            "<if test='lastPulledAt != null'>AND updated_at &gt; #{lastPulledAt}</if>",
            "ORDER BY rank_index ASC",
            "</script>"
    })
    List<Folder> selectForSync(@Param("userId") String userId,
                               @Param("lastPulledAt") OffsetDateTime lastPulledAt);

    @Select("SELECT * FROM folders WHERE id = #{id}")
    Folder selectAnyById(@Param("id") String id);
}
