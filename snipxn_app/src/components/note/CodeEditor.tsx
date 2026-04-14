import { forwardRef, useImperativeHandle } from 'react';
import { TextInput } from 'react-native';

import { useDeviceType } from '../../hooks';
import { useI18n } from '../../i18n';
import { useAppTheme } from '../../theme';
import { GlassPanel } from '../common/AppChrome';

export interface CodeEditorHandle {
  scrollToLine: (line: number) => void;
}

export interface CodeEditorProps {
  content: string;
  language: string;
  readOnly?: boolean;
  onContentChange: (content: string) => void;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { content, readOnly = false, onContentChange },
  ref,
) {
  const { typography, palette } = useAppTheme();
  const { isTablet } = useDeviceType();
  const { t } = useI18n();

  useImperativeHandle(
    ref,
    () => ({
      scrollToLine: () => {
        // The compact editor intentionally avoids Monaco-specific line navigation.
      },
    }),
    [],
  );

  return (
    <GlassPanel className="flex-1 px-4 py-4" variant="inset">
      <TextInput
        autoCapitalize="none"
        className={`${typography.code} flex-1`}
        editable={!readOnly}
        multiline
        onChangeText={onContentChange}
        placeholder={t('开始编写 Markdown 或代码片段...')}
        placeholderTextColor={palette.placeholder}
        scrollEnabled
        style={{
          color: palette.text,
          fontSize: isTablet ? 16 : 14,
          paddingHorizontal: 0,
          paddingTop: 0,
          textAlignVertical: 'top',
        }}
        underlineColorAndroid="transparent"
        value={content}
      />
    </GlassPanel>
  );
});

CodeEditor.displayName = 'CodeEditor';
