package com.snipxn.common.result;

import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

import java.util.List;

/**
 * 分页响应体，配合 MyBatis Plus IPage 使用
 */
@Getter
@Schema(name = "PageResult", description = "分页响应体")
public class PageResult<T> {

    /** 当前页数据 */
    @Schema(description = "当前页数据列表")
    private final List<T> records;
    /** 总记录数 */
    @Schema(description = "总记录数", example = "128")
    private final long total;
    /** 当前页码（从 1 开始）*/
    @Schema(description = "当前页码，从 1 开始", example = "1")
    private final long page;
    /** 每页条数 */
    @Schema(description = "每页条数", example = "20")
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
