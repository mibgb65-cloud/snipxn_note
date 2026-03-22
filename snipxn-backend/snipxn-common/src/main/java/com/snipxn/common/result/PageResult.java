package com.snipxn.common.result;

import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.Getter;

import java.util.List;

/**
 * 分页响应体，配合 MyBatis Plus IPage 使用
 */
@Getter
public class PageResult<T> {

    /** 当前页数据 */
    private final List<T> records;
    /** 总记录数 */
    private final long total;
    /** 当前页码（从 1 开始）*/
    private final long page;
    /** 每页条数 */
    private final long size;

    private PageResult(List<T> records, long total, long page, long size) {
        this.records = records;
        this.total = total;
        this.page = page;
        this.size = size;
    }

    /** 从 MyBatis Plus IPage 直接构建 */
    public static <T> PageResult<T> of(IPage<T> page) {
        return new PageResult<>(page.getRecords(), page.getTotal(), page.getCurrent(), page.getSize());
    }
}
