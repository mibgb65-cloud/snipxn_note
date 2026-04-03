package com.snipxn.community.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.common.result.Result;
import com.snipxn.community.dto.resp.RecommendedUserResponse;
import com.snipxn.community.dto.resp.UserProfileResponse;
import com.snipxn.community.mapper.UserFollowMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/follow")
@RequiredArgsConstructor
@Tag(name = "关注", description = "用户关注关系、推荐与公开资料接口")
public class FollowController {

    private final UserFollowMapper userFollowMapper;

    @Operation(summary = "关注用户")
    @SecurityRequirement(name = "Bearer Token")
    @PostMapping("/{userId}")
    public Result<Void> follow(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                               @Parameter(description = "被关注用户 ID") @PathVariable String userId) {
        String currentUserId = userDetails.getUserId();
        if (currentUserId.equals(userId)) {
            throw new BusinessException(ErrorCode.FOLLOW_SELF);
        }
        try {
            userFollowMapper.follow(currentUserId, userId);
        } catch (DuplicateKeyException e) {
            throw new BusinessException(ErrorCode.ALREADY_FOLLOWED);
        }
        return Result.success();
    }

    @Operation(summary = "取消关注用户")
    @SecurityRequirement(name = "Bearer Token")
    @DeleteMapping("/{userId}")
    public Result<Void> unfollow(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
                                 @Parameter(description = "被取消关注的用户 ID") @PathVariable String userId) {
        userFollowMapper.unfollow(userDetails.getUserId(), userId);
        return Result.success();
    }

    @Operation(summary = "获取我关注的用户 ID 列表")
    @SecurityRequirement(name = "Bearer Token")
    @GetMapping("/following")
    public Result<List<String>> listFollowing(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(userFollowMapper.selectFollowingIds(userDetails.getUserId()));
    }

    @Operation(summary = "获取关注我的用户 ID 列表")
    @SecurityRequirement(name = "Bearer Token")
    @GetMapping("/followers")
    public Result<List<String>> listFollowers(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(userFollowMapper.selectFollowerIds(userDetails.getUserId()));
    }

    @Operation(summary = "获取推荐关注用户")
    @SecurityRequirement(name = "Bearer Token")
    @GetMapping("/recommended")
    public Result<List<RecommendedUserResponse>> recommended(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "推荐数量上限，服务端最大按 20 处理", example = "5")
            @RequestParam(defaultValue = "5") int limit) {
        return Result.success(userFollowMapper.selectRecommendedUsers(userDetails.getUserId(), Math.min(limit, 20)));
    }

    @Operation(summary = "获取关注统计")
    @SecurityRequirement(name = "Bearer Token")
    @GetMapping("/stats")
    public Result<Map<String, Long>> stats(@Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        String userId = userDetails.getUserId();
        Map<String, Long> map = Map.of(
                "followingCount", userFollowMapper.countFollowing(userId),
                "followerCount", userFollowMapper.countFollowers(userId)
        );
        return Result.success(map);
    }

    @Operation(summary = "获取用户公开资料", description = "匿名访问时不会返回当前用户是否已关注的个性化状态")
    @GetMapping("/user/{userId}/profile")
    public Result<UserProfileResponse> userProfile(
            @Parameter(description = "用户 ID") @PathVariable String userId,
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails userDetails) {
        UserProfileResponse profile = userFollowMapper.selectUserProfile(userId);
        if (profile == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (userDetails != null) {
            String currentUserId = userDetails.getUserId();
            profile.setIsFollowing(
                    !currentUserId.equals(userId) && userFollowMapper.isFollowing(currentUserId, userId) > 0
            );
        }
        return Result.success(profile);
    }
}
