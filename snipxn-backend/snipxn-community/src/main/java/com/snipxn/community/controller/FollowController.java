package com.snipxn.community.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.common.result.Result;
import com.snipxn.community.dto.resp.RecommendedUserResponse;
import com.snipxn.community.dto.resp.UserProfileResponse;
import com.snipxn.community.mapper.UserFollowMapper;
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
public class FollowController {

    private final UserFollowMapper userFollowMapper;

    @PostMapping("/{userId}")
    public Result<Void> follow(@AuthenticationPrincipal CustomUserDetails userDetails,
                               @PathVariable String userId) {
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

    @DeleteMapping("/{userId}")
    public Result<Void> unfollow(@AuthenticationPrincipal CustomUserDetails userDetails,
                                 @PathVariable String userId) {
        userFollowMapper.unfollow(userDetails.getUserId(), userId);
        return Result.success();
    }

    @GetMapping("/following")
    public Result<List<String>> listFollowing(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(userFollowMapper.selectFollowingIds(userDetails.getUserId()));
    }

    @GetMapping("/followers")
    public Result<List<String>> listFollowers(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return Result.success(userFollowMapper.selectFollowerIds(userDetails.getUserId()));
    }

    @GetMapping("/recommended")
    public Result<List<RecommendedUserResponse>> recommended(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "5") int limit) {
        return Result.success(userFollowMapper.selectRecommendedUsers(userDetails.getUserId(), Math.min(limit, 20)));
    }

    @GetMapping("/stats")
    public Result<Map<String, Long>> stats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String userId = userDetails.getUserId();
        Map<String, Long> map = Map.of(
                "followingCount", userFollowMapper.countFollowing(userId),
                "followerCount", userFollowMapper.countFollowers(userId)
        );
        return Result.success(map);
    }

    @GetMapping("/user/{userId}/profile")
    public Result<UserProfileResponse> userProfile(
            @PathVariable String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
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
