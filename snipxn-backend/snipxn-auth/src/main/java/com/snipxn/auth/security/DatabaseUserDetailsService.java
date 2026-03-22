package com.snipxn.auth.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snipxn.auth.entity.User;
import com.snipxn.auth.entity.UserAuth;
import com.snipxn.auth.mapper.UserAuthMapper;
import com.snipxn.auth.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class DatabaseUserDetailsService implements UserDetailsService {

    private final UserMapper userMapper;
    private final UserAuthMapper userAuthMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, username.strip().toLowerCase()));
        if (user == null) {
            throw UsernameNotFoundException.fromUsername(username);
        }

        UserAuth auth = userAuthMapper.selectOne(new LambdaQueryWrapper<UserAuth>()
                .eq(UserAuth::getUserId, user.getId())
                .eq(UserAuth::getIdentityType, "PASSWORD"));
        if (auth == null || !StringUtils.hasText(auth.getCredential())) {
            throw UsernameNotFoundException.fromUsername(username);
        }

        return new CustomUserDetails(
                user.getId(),
                user.getEmail(),
                auth.getCredential(),
                !"BANNED".equals(user.getStatus()),
                !"LOCKED".equals(user.getStatus())
        );
    }
}
