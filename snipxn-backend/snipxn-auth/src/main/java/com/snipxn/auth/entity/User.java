package com.snipxn.auth.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.BaseEntity;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@TableName("users")
public class User extends BaseEntity {

    private String email;
    private String nickname;
    private String avatar;
    private String bio;
    private Short gender;
    private LocalDate birthday;
    private Long storageLimit;
    private Long storageUsed;
    /** ACTIVE / BANNED / LOCKED */
    private String status;
}
