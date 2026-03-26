package com.snipxn.community.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snipxn.community.entity.PostShare;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface PostShareMapper extends BaseMapper<PostShare> {

    @Select("""
            SELECT * FROM post_shares
            WHERE share_token = #{shareToken}
            LIMIT 1
            """)
    PostShare selectByShareToken(@Param("shareToken") String shareToken);

    @Select("""
            SELECT * FROM post_shares
            WHERE post_id = #{postId}
            LIMIT 1
            """)
    PostShare selectByPostId(@Param("postId") String postId);
}
