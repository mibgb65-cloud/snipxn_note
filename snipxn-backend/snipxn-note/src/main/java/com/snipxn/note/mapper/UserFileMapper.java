package com.snipxn.note.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snipxn.note.entity.UserFile;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface UserFileMapper extends BaseMapper<UserFile> {

    @Select("SELECT COALESCE(SUM(file_size), 0) FROM user_files WHERE user_id = #{userId}")
    long sumFileBytes(@Param("userId") String userId);
}
