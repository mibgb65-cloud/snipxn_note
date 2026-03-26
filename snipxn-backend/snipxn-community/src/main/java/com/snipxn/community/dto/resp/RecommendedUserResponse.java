package com.snipxn.community.dto.resp;

import lombok.Data;

@Data
public class RecommendedUserResponse {

    private String userId;
    private String nickname;
    private String avatar;
    private Long postCount;
    private String primaryLanguage;
    private Double engagementScore;
}
