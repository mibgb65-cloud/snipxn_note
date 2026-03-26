package com.snipxn.community.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class UserProfileResponse {

    private String userId;
    private String nickname;
    private String avatar;
    private String bio;
    private OffsetDateTime createdAt;

    private Long postCount;
    private Long followerCount;
    private Long followingCount;
    private String primaryLanguage;
    private String website;
    private String github;
    private String location;
    private String company;
    private String techStack;

    /** 当前登录用户是否关注了该用户，未登录为 null */
    private Boolean isFollowing;
}
