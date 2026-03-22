package com.snipxn.note.service;

import com.snipxn.note.dto.req.SyncPushRequest;
import com.snipxn.note.dto.resp.SyncPullResponse;

import java.time.OffsetDateTime;

public interface SyncService {

    /** 客户端拉取：返回 lastPulledAt 之后变更的数据 */
    SyncPullResponse pull(String userId, OffsetDateTime lastPulledAt);

    /** 客户端推送：接收本地离线变更，返回冲突项 */
    SyncPullResponse push(String userId, SyncPushRequest req);
}
