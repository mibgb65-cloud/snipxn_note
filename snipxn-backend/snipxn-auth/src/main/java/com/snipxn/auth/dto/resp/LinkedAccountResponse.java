package com.snipxn.auth.dto.resp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LinkedAccountResponse {

    /** PASSWORD / GITHUB / GOOGLE */
    private String identityType;

    /** 脱敏标识：邮箱脱敏 / OAuth 平台名 */
    private String displayIdentifier;

    /** 绑定时间 */
    private OffsetDateTime linkedAt;
}
