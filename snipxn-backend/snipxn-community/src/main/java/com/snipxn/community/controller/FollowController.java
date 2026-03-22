package com.snipxn.community.controller;

import com.snipxn.auth.security.CustomUserDetails;
import com.snipxn.common.exception.BusinessException;
import com.snipxn.common.exception.ErrorCode;
import com.snipxn.common.result.Result;
import com.snipxn.community.mapper.UserFollowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @GetMapping("/stats")
    public Result<Map<String, Long>> stats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String userId = userDetails.getUserId();
        Map<String, Long> map = Map.of(
                "followingCount", userFollowMapper.countFollowing(userId),
                "followerCount", userFollowMapper.countFollowers(userId)
        );
        return Result.success(map);
    }
}
