package com.snipxn.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snipxn.auth.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    @Update("UPDATE users SET storage_used = GREATEST(0, COALESCE(storage_used, 0) + #{delta}) WHERE id = #{userId}")
    int addStorageUsed(@Param("userId") String userId, @Param("delta") long delta);
}
