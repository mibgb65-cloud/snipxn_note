export const UI_FONTS = [
  {
    id: 'misans',
    nameKey: 'font.ui.misans',
    fontFamily: "'MiSans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei UI', sans-serif",
    preview: 'MiSans 小米字体',
  },
  {
    id: 'inter',
    nameKey: 'font.ui.inter',
    fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    preview: 'Inter Modern UI',
  },
  {
    id: 'noto-sans-sc',
    nameKey: 'font.ui.notoSansSC',
    fontFamily: "'Noto Sans SC', 'Source Han Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    preview: 'Noto Sans 思源黑体',
  },
  {
    id: 'harmonyos-sans',
    nameKey: 'font.ui.harmonyOSSans',
    fontFamily: "'HarmonyOS Sans SC', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    preview: 'HarmonyOS Sans',
  },
  {
    id: 'system',
    nameKey: 'font.ui.system',
    fontFamily: '',
    preview: 'System Default',
  },
];

export const CODE_FONTS = [
  {
    id: 'jetbrains-mono',
    nameKey: 'font.code.jetbrainsMono',
    fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
    preview: 'const x = 42;',
  },
  {
    id: 'fira-code',
    nameKey: 'font.code.firaCode',
    fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
    preview: 'fn => x !== y',
  },
  {
    id: 'source-code-pro',
    nameKey: 'font.code.sourceCodePro',
    fontFamily: "'Source Code Pro', 'DejaVu Sans Mono', Consolas, monospace",
    preview: 'if (a === b) {}',
  },
  {
    id: 'cascadia-code',
    nameKey: 'font.code.cascadiaCode',
    fontFamily: "'Cascadia Code', 'Cascadia Mono', Consolas, monospace",
    preview: 'let arr = [1,2];',
  },
  {
    id: 'sarasa-mono',
    nameKey: 'font.code.sarasaMono',
    fontFamily: "'Sarasa Mono SC', 'Noto Sans Mono CJK SC', 'Microsoft YaHei UI', monospace",
    preview: '更纱黑体 code;',
  },
  {
    id: 'system-mono',
    nameKey: 'font.code.systemMono',
    fontFamily: '',
    preview: 'System Mono',
  },
];

export function getUiFontById(id) {
  return UI_FONTS.find((f) => f.id === id);
}

export function getCodeFontById(id) {
  return CODE_FONTS.find((f) => f.id === id);
}
