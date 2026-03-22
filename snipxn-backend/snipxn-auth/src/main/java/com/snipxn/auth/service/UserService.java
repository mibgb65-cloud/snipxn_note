package com.snipxn.auth.service;

import com.snipxn.auth.dto.req.SetPasswordRequest;
import com.snipxn.auth.dto.req.UpdateProfileRequest;
import com.snipxn.auth.dto.resp.DeviceResponse;
import com.snipxn.auth.dto.resp.UserInfoResponse;

import java.util.List;

public interface UserService {

    /** 获取当前用户信息 */
    UserInfoResponse getMe(String userId);

    /** 更新个人资料 */
    void updateProfile(String userId, UpdateProfileRequest request);

    /** 设置/修改密码（改密后吊销除当前设备外的所有其他设备） */
    void setPassword(String userId, String currentDeviceId, SetPasswordRequest request);

    /** 获取当前用户所有设备列表 */
    List<DeviceResponse> listDevices(String userId);

    /** 踢下线指定设备 */
    void revokeDevice(String userId, String deviceId);

    /** 踢出除当前设备外的所有其他设备 */
    void revokeAllOtherDevices(String userId, String currentDeviceId);
}
