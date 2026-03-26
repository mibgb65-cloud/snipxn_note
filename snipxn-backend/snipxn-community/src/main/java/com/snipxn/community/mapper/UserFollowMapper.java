package com.snipxn.community.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.snipxn.community.dto.resp.RecommendedUserResponse;
import com.snipxn.community.dto.resp.UserProfileResponse;

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

    @Select("""
            SELECT u.id AS userId,
                   u.nickname,
                   u.avatar,
                   COUNT(p.id) AS postCount,
                   MODE() WITHIN GROUP (ORDER BY p.language) AS primaryLanguage,
                   COALESCE(SUM(p.like_count * 5 + p.collect_count * 6 + p.view_count + p.comment_count * 3), 0) AS engagementScore
            FROM users u
            LEFT JOIN posts p ON p.user_id = u.id AND p.status = 'PUBLISHED'
            WHERE u.id <> #{userId}
              AND u.id NOT IN (SELECT following_id FROM user_follows WHERE follower_id = #{userId})
              AND u.status = 'ACTIVE'
            GROUP BY u.id, u.nickname, u.avatar
            ORDER BY engagementScore DESC
            LIMIT #{limit}
            """)
    List<RecommendedUserResponse> selectRecommendedUsers(@Param("userId") String userId,
                                                          @Param("limit") int limit);

    @Select("""
            SELECT u.id          AS userId,
                   u.nickname,
                   u.avatar,
                   u.bio,
                   u.website,
                   u.github,
                   u.location,
                   u.company,
                   u.tech_stack AS techStack,
                   u.created_at  AS createdAt,
                   COALESCE(pc.cnt, 0)  AS postCount,
                   COALESCE(fer.cnt, 0) AS followerCount,
                   COALESCE(fng.cnt, 0) AS followingCount,
                   pl.primaryLanguage
            FROM users u
            LEFT JOIN (SELECT user_id AS uid, COUNT(*) AS cnt FROM posts WHERE status = 'PUBLISHED' GROUP BY user_id) pc
                ON pc.uid = u.id
            LEFT JOIN (SELECT following_id AS uid, COUNT(*) AS cnt FROM user_follows GROUP BY following_id) fer
                ON fer.uid = u.id
            LEFT JOIN (SELECT follower_id AS uid, COUNT(*) AS cnt FROM user_follows GROUP BY follower_id) fng
                ON fng.uid = u.id
            LEFT JOIN LATERAL (
                SELECT MODE() WITHIN GROUP (ORDER BY p2.language) AS primaryLanguage
                FROM posts p2
                WHERE p2.user_id = u.id AND p2.status = 'PUBLISHED' AND p2.language IS NOT NULL
            ) pl ON true
            WHERE u.id = #{userId}
            """)
    UserProfileResponse selectUserProfile(@Param("userId") String userId);
}
