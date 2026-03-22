package com.snipxn.community.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserFollowMapper {

    @Select("SELECT COUNT(*) FROM user_follows WHERE follower_id = #{followerId} AND following_id = #{followingId}")
    long isFollowing(@Param("followerId") String followerId, @Param("followingId") String followingId);

    @Insert("INSERT INTO user_follows (follower_id, following_id) VALUES (#{followerId}, #{followingId})")
    int follow(@Param("followerId") String followerId, @Param("followingId") String followingId);

    @Delete("DELETE FROM user_follows WHERE follower_id = #{followerId} AND following_id = #{followingId}")
    int unfollow(@Param("followerId") String followerId, @Param("followingId") String followingId);

    @Select("SELECT following_id FROM user_follows WHERE follower_id = #{userId} ORDER BY created_at DESC")
    List<String> selectFollowingIds(@Param("userId") String userId);

    @Select("SELECT follower_id FROM user_follows WHERE following_id = #{userId} ORDER BY created_at DESC")
    List<String> selectFollowerIds(@Param("userId") String userId);

    @Select("SELECT COUNT(*) FROM user_follows WHERE follower_id = #{userId}")
    long countFollowing(@Param("userId") String userId);

    @Select("SELECT COUNT(*) FROM user_follows WHERE following_id = #{userId}")
    long countFollowers(@Param("userId") String userId);
}
