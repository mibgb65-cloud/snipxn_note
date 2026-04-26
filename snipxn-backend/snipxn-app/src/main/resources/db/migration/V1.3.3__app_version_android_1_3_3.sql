INSERT INTO app_version (
    platform,
    version,
    build_number,
    update_url,
    release_notes,
    published_at
)
SELECT
    'ANDROID',
    '1.3.3',
    '7',
    'https://snipxn.com/downloads/snipxn-v1.3.3.apk',
    '优化笔记自动保存、分享与标签弹窗、图片分享和社区发布确认，并更新官网安装包入口。',
    now()
WHERE NOT EXISTS (
    SELECT 1
    FROM app_version
    WHERE platform = 'ANDROID'
      AND version = '1.3.3'
      AND build_number = '7'
);
