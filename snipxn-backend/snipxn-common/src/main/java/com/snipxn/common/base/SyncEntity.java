package com.snipxn.common.base;

import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.Version;

/**
 * 同步实体：在 BaseEntity 基础上增加离线同步所需字段
 * 适用于需要客户端离线同步的表：folders / notes / tags
 *
 * - isDeleted：软删除标记，MyBatis Plus @TableLogic 自动拦截 delete/select
 * - version：乐观锁版本号，@Version 在 update 时自动校验并递增
 */
public abstract class SyncEntity extends BaseEntity {

    /** 软删除标记：false-正常，true-已删除；MyBatis Plus 自动过滤已删除记录 */
    @TableLogic(value = "false", delval = "true")
    private Boolean isDeleted;

    /** 乐观锁版本号：每次 update 自动 +1，冲突时抛出 OptimisticLockingFailureException */
    @Version
    private Long version;

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
}
