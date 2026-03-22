package com.snipxn.note.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snipxn.note.entity.Tag;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.OffsetDateTime;
import java.util.List;

public interface TagMapper extends BaseMapper<Tag> {

    @Select({
            "<script>",
            "SELECT * FROM tags",
            "WHERE user_id = #{userId}",
            "<if test='lastPulledAt != null'>AND updated_at &gt; #{lastPulledAt}</if>",
            "ORDER BY updated_at ASC",
            "</script>"
    })
    List<Tag> selectForSync(@Param("userId") String userId,
                            @Param("lastPulledAt") OffsetDateTime lastPulledAt);

    @Select("SELECT * FROM tags WHERE id = #{id}")
    Tag selectAnyById(@Param("id") String id);
}
