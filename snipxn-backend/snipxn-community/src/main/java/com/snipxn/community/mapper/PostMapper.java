package com.snipxn.community.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snipxn.community.entity.Post;
import org.apache.ibatis.annotations.*;

import java.util.List;

public interface PostMapper extends BaseMapper<Post> {

    @Select("""
            SELECT * FROM posts
            WHERE status = 'PUBLISHED'
            ORDER BY created_at DESC
            LIMIT #{limit} OFFSET #{offset}
            """)
    List<Post> selectPublishedPage(@Param("limit") long limit, @Param("offset") long offset);

    @Select("""
            SELECT COUNT(*) FROM posts
            WHERE status = 'PUBLISHED'
            """)
    long countPublished();

    @Select("""
            SELECT * FROM posts
            WHERE user_id = #{userId}
              AND status = 'PUBLISHED'
            ORDER BY created_at DESC
            LIMIT #{limit} OFFSET #{offset}
            """)
    List<Post> selectByUserPage(@Param("userId") String userId,
                                @Param("limit") long limit,
                                @Param("offset") long offset);

    @Select("""
            SELECT COUNT(*) FROM posts
            WHERE user_id = #{userId}
              AND status = 'PUBLISHED'
            """)
    long countByUser(@Param("userId") String userId);

    @Update("UPDATE posts SET view_count = view_count + 1 WHERE id = #{postId}")
    int incrementViewCount(@Param("postId") String postId);

    @Update("UPDATE posts SET like_count = like_count + #{delta}, updated_at = NOW() WHERE id = #{postId}")
    int updateLikeCount(@Param("postId") String postId, @Param("delta") int delta);

    @Update("UPDATE posts SET collect_count = collect_count + #{delta}, updated_at = NOW() WHERE id = #{postId}")
    int updateCollectCount(@Param("postId") String postId, @Param("delta") int delta);
}
