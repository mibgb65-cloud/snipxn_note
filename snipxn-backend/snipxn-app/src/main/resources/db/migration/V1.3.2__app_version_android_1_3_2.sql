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
    '1.3.2',
    '6',
    'https://snipxn.com/downloads/snipxn-v1.3.2.apk',
    '优化平板侧栏动效、设置页布局、全屏编辑体验、新建文件夹弹层和官网下载入口。',
    now()
WHERE NOT EXISTS (
    SELECT 1
    FROM app_version
    WHERE platform = 'ANDROID'
      AND version = '1.3.2'
      AND build_number = '6'
);
