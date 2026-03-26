package com.snipxn.auth.dto.resp;

import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
public class UserInfoResponse {

    private String id;
    private String email;
    private String nickname;
    private String avatar;
    private String bio;
    private Short gender;
    private LocalDate birthday;
    private Long storageLimit;
    private Long storageUsed;
    private String status;
    private String website;
    private String github;
    private String location;
    private String company;
    private String techStack;
    private OffsetDateTime createdAt;
}
