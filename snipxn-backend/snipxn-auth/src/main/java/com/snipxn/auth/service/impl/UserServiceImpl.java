package com.snipxn.auth.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.snipxn.auth.dto.req.SetPasswordRequest;
import com.snipxn.auth.dto.req.UpdateProfileRequest;
import com.snipxn.auth.dto.resp.DeviceResponse;
import com.snipxn.auth.dto.resp.UserInfoResponse;
import com.snipxn.auth.entity.User;
import com.snipxn.auth.entity.UserAuth;
import com.snipxn.auth.entity.UserDevice;
import com.snipxn.auth.mapper.UserAuthMapper;
import com.snipxn.auth.mapper.UserDeviceMapper;
import com.snipxn.auth.mapper.UserMapper;
import com.snipxn.auth.service.DeviceRevokeService;
import com.snipxn.auth.service.UserService;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final UserAuthMapper userAuthMapper;
    private final UserDeviceMapper userDeviceMapper;
    private final PasswordEncoder passwordEncoder;
    private final DeviceRevokeService deviceRevokeService;

    @Override
    public UserInfoResponse getMe(String userId) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        UserInfoResponse resp = new UserInfoResponse();
        BeanUtils.copyProperties(user, resp);
        return resp;
    }

    @Override
    public void updateProfile(String userId, UpdateProfileRequest req) {
        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<User>()
                .eq(User::getId, userId);
        boolean hasUpdates = false;

        if (req.getNickname() != null) {
            updateWrapper.set(User::getNickname, normalizeOptionalText(req.getNickname()));
            hasUpdates = true;
        }
        if (req.getAvatar() != null) {
            updateWrapper.set(User::getAvatar, normalizeOptionalText(req.getAvatar()));
            hasUpdates = true;
        }
        if (req.getBio() != null) {
            updateWrapper.set(User::getBio, normalizeOptionalText(req.getBio()));
            hasUpdates = true;
        }
        if (req.getGender() != null) {
            updateWrapper.set(User::getGender, req.getGender());
            hasUpdates = true;
        }
        if (req.getBirthday() != null) {
            updateWrapper.set(User::getBirthday, req.getBirthday());
            hasUpdates = true;
        }
        if (req.getWebsite() != null) {
            updateWrapper.set(User::getWebsite, normalizeOptionalText(req.getWebsite()));
            hasUpdates = true;
        }
        if (req.getGithub() != null) {
            updateWrapper.set(User::getGithub, normalizeOptionalText(req.getGithub()));
            hasUpdates = true;
        }
        if (req.getLocation() != null) {
            updateWrapper.set(User::getLocation, normalizeOptionalText(req.getLocation()));
            hasUpdates = true;
        }
        if (req.getCompany() != null) {
            updateWrapper.set(User::getCompany, normalizeOptionalText(req.getCompany()));
            hasUpdates = true;
        }
        if (req.getTechStack() != null) {
            updateWrapper.set(User::getTechStack, normalizeOptionalText(req.getTechStack()));
            hasUpdates = true;
        }

        if (!hasUpdates) {
            return;
        }

        userMapper.update(null, updateWrapper);
    }

    @Override
    @Transactional
    public void setPassword(String userId, String currentDeviceId, SetPasswordRequest req) {
        UserAuth auth = userAuthMapper.selectOne(new LambdaQueryWrapper<UserAuth>()
                .eq(UserAuth::getUserId, userId)
                .eq(UserAuth::getIdentityType, "PASSWORD"));

        if (auth != null) {
            // 已有密码，需验证旧密码
            if (!StringUtils.hasText(req.getOldPassword())
                    || !passwordEncoder.matches(req.getOldPassword(), auth.getCredential())) {
                throw new BusinessException(ErrorCode.PASSWORD_WRONG);
            }
            userAuthMapper.update(new LambdaUpdateWrapper<UserAuth>()
                    .eq(UserAuth::getUserId, userId)
                    .eq(UserAuth::getIdentityType, "PASSWORD")
                    .set(UserAuth::getCredential, passwordEncoder.encode(req.getNewPassword())));
        } else {
            // 首次设置密码（第三方登录用户）
            User user = userMapper.selectById(userId);
            UserAuth newAuth = new UserAuth();
            newAuth.setUserId(userId);
            newAuth.setIdentityType("PASSWORD");
            newAuth.setIdentifier(user.getEmail());
            newAuth.setCredential(passwordEncoder.encode(req.getNewPassword()));
            userAuthMapper.insert(newAuth);
        }

        // 改密后吊销除当前设备外的所有其他设备
        revokeAllOtherDevices(userId, currentDeviceId);
    }

    @Override
    public List<DeviceResponse> listDevices(String userId) {
        List<UserDevice> devices = userDeviceMapper.selectList(new LambdaQueryWrapper<UserDevice>()
                .eq(UserDevice::getUserId, userId)
                .eq(UserDevice::getIsRevoked, false)
                .orderByDesc(UserDevice::getLastLoginAt));

        return devices.stream().map(d -> {
            DeviceResponse resp = new DeviceResponse();
            resp.setDeviceId(d.getDeviceId());
            resp.setDeviceName(d.getDeviceName());
            resp.setLastLoginIp(d.getLastLoginIp());
            resp.setLastLoginAt(d.getLastLoginAt());
            return resp;
        }).toList();
    }

    @Override
    public void revokeDevice(String userId, String deviceId) {
        long count = userDeviceMapper.selectCount(new LambdaQueryWrapper<UserDevice>()
                .eq(UserDevice::getUserId, userId)
                .eq(UserDevice::getDeviceId, deviceId));
        if (count == 0) throw new BusinessException(ErrorCode.DEVICE_NOT_FOUND);

        userDeviceMapper.update(new LambdaUpdateWrapper<UserDevice>()
                .eq(UserDevice::getUserId, userId)
                .eq(UserDevice::getDeviceId, deviceId)
                .set(UserDevice::getIsRevoked, true));

        // Redis 黑名单，Access Token 立即失效
        deviceRevokeService.revoke(userId, deviceId);
    }

    @Override
    public void revokeAllOtherDevices(String userId, String currentDeviceId) {
        // 查出所有未吊销的其他设备
        List<UserDevice> others = userDeviceMapper.selectList(new LambdaQueryWrapper<UserDevice>()
                .eq(UserDevice::getUserId, userId)
                .ne(UserDevice::getDeviceId, currentDeviceId)
                .eq(UserDevice::getIsRevoked, false));

        if (others.isEmpty()) return;

        // DB 批量吊销
        userDeviceMapper.update(new LambdaUpdateWrapper<UserDevice>()
                .eq(UserDevice::getUserId, userId)
                .ne(UserDevice::getDeviceId, currentDeviceId)
                .eq(UserDevice::getIsRevoked, false)
                .set(UserDevice::getIsRevoked, true));

        // Redis 黑名单逐个写入
        for (UserDevice device : others) {
            deviceRevokeService.revoke(userId, device.getDeviceId());
        }
    }

    private String normalizeOptionalText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
