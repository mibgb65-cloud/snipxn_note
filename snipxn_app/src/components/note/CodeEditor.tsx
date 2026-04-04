import { Image, Text, TextInput, View } from 'react-native';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { useDeviceType } from '../../hooks';
import { translateLiteral, useI18n } from '../../i18n';
import { useAppTheme, withAlpha } from '../../theme';
import { GlassPanel } from '../common/AppChrome';

const editorHtmlAsset = require('../../assets/editor/monaco-editor.html') as number;

type EditorTheme = 'light' | 'dark';

type EditorMessage =
  | {
      type: 'SET_CONTENT';
      payload: {
        content: string;
        language: string;
      };
    }
  | {
      type: 'SET_THEME';
      payload: EditorTheme;
    }
  | {
      type: 'SET_READONLY';
      payload: boolean;
    }
  | {
      type: 'SET_LANGUAGE';
      payload: string;
    }
  | {
      type: 'SCROLL_TO_LINE';
      payload: number;
    };

export interface CodeEditorHandle {
  scrollToLine: (line: number) => void;
}

type EditorEvent =
  | {
      type: 'CONTENT_CHANGED';
      payload: {
        content: string;
      };
    }
  | {
      type: 'EDITOR_READY';
    }
  | {
      type: 'EDITOR_ERROR';
      payload?: {
        message?: string;
      };
    };

export interface CodeEditorProps {
  content: string;
  language: string;
  readOnly?: boolean;
  onContentChange: (content: string) => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return translateLiteral(error.message);
  }

  return fallback;
}

function normalizeLanguage(language: string): string {
  return language.trim().length > 0 ? language.trim() : 'markdown';
}

function createBootScript(config: {
  content: string;
  language: string;
  readOnly: boolean;
  theme: EditorTheme;
  fontSize: number;
}): string {
  return `window.__SNIPXN_EDITOR_BOOT__ = ${JSON.stringify(config)}; true;`;
}

function FallbackCodeEditor({
  content,
  readOnly = false,
  onContentChange,
}: CodeEditorProps) {
  const { palette, typography } = useAppTheme();
  const { isTablet } = useDeviceType();
  const { t } = useI18n();

  return (
    <GlassPanel className="flex-1 gap-3 px-4 py-4" variant="inset">
      <Text className={typography.bodySmall} style={{ color: palette.textSoft }}>
        {t('当前使用兼容编辑模式。')}
      </Text>
      <TextInput
        autoCapitalize="none"
        className={`${typography.code} flex-1`}
        editable={!readOnly}
        multiline
        onChangeText={onContentChange}
        placeholder={t('开始编写 Markdown 或代码片段...')}
        placeholderTextColor={palette.placeholder}
        style={{ color: palette.text, fontSize: isTablet ? 16 : 14, textAlignVertical: 'top' }}
        value={content}
      />
    </GlassPanel>
  );
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  {
    content,
    language,
    readOnly = false,
    onContentChange,
  },
  ref,
) {
  const webViewRef = useRef<WebView | null>(null);
  const readyRef = useRef(false);
  const latestContentRef = useRef(content);
  const { palette, theme, typography } = useAppTheme();
  const { isTablet } = useDeviceType();
  const { t } = useI18n();
  const [useFallbackEditor, setUseFallbackEditor] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false);

  const editorTheme: EditorTheme = theme === 'dark' ? 'dark' : 'light';
  const fontSize = isTablet ? 16 : 14;
  const normalizedLanguage = normalizeLanguage(language);
  const resolvedEditorUri = useMemo(() => Image.resolveAssetSource(editorHtmlAsset).uri, []);

  const initialBootScript = useMemo(
    () =>
      createBootScript({
        content,
        language: normalizedLanguage,
        readOnly,
        theme: editorTheme,
        fontSize,
      }),
    [content, editorTheme, fontSize, normalizedLanguage, readOnly],
  );

  const postEditorMessage = (message: EditorMessage) => {
    if (!readyRef.current || !webViewRef.current) {
      return;
    }

    webViewRef.current.postMessage(JSON.stringify(message));
  };

  useImperativeHandle(ref, () => ({
    scrollToLine: (line: number) => {
      postEditorMessage({ type: 'SCROLL_TO_LINE', payload: line });
    },
  }));

  const syncEditorState = () => {
    postEditorMessage({
      type: 'SET_CONTENT',
      payload: {
        content,
        language: normalizedLanguage,
      },
    });
    latestContentRef.current = content;
    postEditorMessage({
      type: 'SET_THEME',
      payload: editorTheme,
    });
    postEditorMessage({
      type: 'SET_READONLY',
      payload: readOnly,
    });
    postEditorMessage({
      type: 'SET_LANGUAGE',
      payload: normalizedLanguage,
    });
  };

  useEffect(() => {
    if (!readyRef.current) {
      return;
    }

    if (content !== latestContentRef.current) {
      postEditorMessage({
        type: 'SET_CONTENT',
        payload: {
          content,
          language: normalizedLanguage,
        },
      });
      latestContentRef.current = content;
    }
  }, [content, normalizedLanguage]);

  useEffect(() => {
    if (!readyRef.current) {
      return;
    }

    postEditorMessage({ type: 'SET_THEME', payload: editorTheme });
  }, [editorTheme]);

  useEffect(() => {
    if (!readyRef.current) {
      return;
    }

    postEditorMessage({ type: 'SET_READONLY', payload: readOnly });
  }, [readOnly]);

  useEffect(() => {
    if (!readyRef.current) {
      return;
    }

    postEditorMessage({ type: 'SET_LANGUAGE', payload: normalizedLanguage });
  }, [normalizedLanguage]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as EditorEvent;

      if (message.type === 'EDITOR_READY') {
        readyRef.current = true;
        setLoadError(null);
        syncEditorState();
        return;
      }

      if (message.type === 'CONTENT_CHANGED') {
        const nextContent = typeof message.payload?.content === 'string' ? message.payload.content : '';
        latestContentRef.current = nextContent;
        onContentChange(nextContent);
        return;
      }

      if (message.type === 'EDITOR_ERROR') {
        setUseFallbackEditor(true);
        setLoadError(message.payload?.message ?? t('编辑器加载失败，已切换到兼容模式。'));
      }
    } catch (error) {
      setUseFallbackEditor(true);
      setLoadError(getErrorMessage(error, t('编辑器通信异常，已切换到兼容模式。')));
    }
  };

  if (useFallbackEditor || !resolvedEditorUri) {
    return (
      <View className="flex-1 gap-3">
        {loadError ? (
          <Text className={typography.bodySmall} style={{ color: palette.warning }}>{loadError}</Text>
        ) : null}
        <FallbackCodeEditor
          content={content}
          language={normalizedLanguage}
          onContentChange={onContentChange}
          readOnly={readOnly}
        />
      </View>
    );
  }

  return (
    <GlassPanel className="flex-1 overflow-hidden" variant="inset">
      {loadError ? (
        <View
          className="border-b px-4 py-2"
          style={{ borderBottomColor: withAlpha(palette.warning, 0.16), backgroundColor: withAlpha(palette.warning, 0.1) }}>
          <Text className={typography.bodySmall} style={{ color: palette.warning }}>{loadError}</Text>
        </View>
      ) : null}
      <WebView
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        androidLayerType="hardware"
        cacheEnabled
        domStorageEnabled
        injectedJavaScriptBeforeContentLoaded={initialBootScript}
        javaScriptEnabled
        mixedContentMode="always"
        onError={event => {
          readyRef.current = false;
          setUseFallbackEditor(true);
          setLoadError(event.nativeEvent.description || t('Monaco WebView 初始化失败。'));
        }}
        onHttpError={() => {
          readyRef.current = false;
          setUseFallbackEditor(true);
          setLoadError(t('Monaco 资源请求失败，已切换到兼容模式。'));
        }}
        onLoadEnd={() => {
          setWebViewLoaded(true);
        }}
        onMessage={handleMessage}
        originWhitelist={['*']}
        setDisplayZoomControls={false}
        setSupportMultipleWindows={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        source={{ uri: resolvedEditorUri }}
        startInLoadingState
        style={{ backgroundColor: 'transparent', flex: 1 }}
      />
      {!webViewLoaded ? (
        <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: palette.panelInset }}>
          <Text className={typography.body} style={{ color: palette.textSoft }}>
            {t('正在装载编辑器...')}
          </Text>
        </View>
      ) : null}
    </GlassPanel>
  );
});

CodeEditor.displayName = 'CodeEditor';
