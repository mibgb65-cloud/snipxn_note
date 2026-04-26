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
    '1.3.1',
    '5',
    'https://snipxn.com/downloads/snipxn-v1.3.1.apk',
    '优化社区发帖体验、深色启动表现、个人资料排版和页面滚动布局。',
    now()
WHERE NOT EXISTS (
    SELECT 1
    FROM app_version
    WHERE platform = 'ANDROID'
      AND version = '1.3.1'
      AND build_number = '5'
);
