package com.snipxn.community.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snipxn.community.entity.Interaction;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface InteractionMapper extends BaseMapper<Interaction> {

    @Select("SELECT action_type FROM interactions WHERE user_id = #{userId} AND target_id = #{targetId}")
    List<String> selectActionTypes(@Param("userId") String userId, @Param("targetId") String targetId);

    @Delete("DELETE FROM interactions WHERE user_id = #{userId} AND target_id = #{targetId} AND action_type = #{actionType}")
    int deleteInteraction(@Param("userId") String userId,
                          @Param("targetId") String targetId,
                          @Param("actionType") String actionType);
}
