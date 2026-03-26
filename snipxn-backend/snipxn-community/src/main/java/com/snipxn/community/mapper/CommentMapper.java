package com.snipxn.community.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snipxn.community.entity.Comment;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

public interface CommentMapper extends BaseMapper<Comment> {

    @Select("""
            SELECT * FROM comments
            WHERE post_id = #{postId}
              AND parent_id IS NULL
              AND status = 'VISIBLE'
            ORDER BY created_at DESC
            LIMIT #{limit} OFFSET #{offset}
            """)
    List<Comment> selectTopLevelByPost(@Param("postId") String postId,
                                       @Param("limit") long limit,
                                       @Param("offset") long offset);

    @Select("""
            SELECT COUNT(*) FROM comments
            WHERE post_id = #{postId}
              AND parent_id IS NULL
              AND status = 'VISIBLE'
            """)
    long countTopLevelByPost(@Param("postId") String postId);

    @Select("""
            SELECT * FROM comments
            WHERE parent_id = #{parentId}
              AND status = 'VISIBLE'
            ORDER BY created_at ASC
            LIMIT #{limit} OFFSET #{offset}
            """)
    List<Comment> selectRepliesByParent(@Param("parentId") String parentId,
                                        @Param("limit") long limit,
                                        @Param("offset") long offset);

    @Select("""
            SELECT COUNT(*) FROM comments
            WHERE parent_id = #{parentId}
              AND status = 'VISIBLE'
            """)
    long countRepliesByParent(@Param("parentId") String parentId);

    @Update("UPDATE comments SET like_count = like_count + #{delta}, updated_at = NOW() WHERE id = #{commentId}")
    int updateLikeCount(@Param("commentId") String commentId, @Param("delta") int delta);

    @Select("""
            SELECT COUNT(*) FROM comments
            WHERE parent_id = #{parentId}
              AND status = 'VISIBLE'
            """)
    long countVisibleReplies(@Param("parentId") String parentId);
}
