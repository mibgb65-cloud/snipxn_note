package com.snipxn.auth.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.snipxn.common.base.BaseEntity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@TableName("user_auths")
public class UserAuth extends BaseEntity {

    private String userId;
    /** PASSWORD / GITHUB / WECHAT / GOOGLE */
    private String identityType;
    /** 密码登录存邮箱，第三方登录存 OpenID */
    private String identifier;
    /** 密码登录存 BCrypt Hash，第三方可为空 */
    private String credential;
}
