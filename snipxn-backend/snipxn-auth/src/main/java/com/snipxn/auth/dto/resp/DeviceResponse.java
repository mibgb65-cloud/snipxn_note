package com.snipxn.auth.dto.resp;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class DeviceResponse {

    private String deviceId;
    private String deviceName;
    private String lastLoginIp;
    private OffsetDateTime lastLoginAt;
}
