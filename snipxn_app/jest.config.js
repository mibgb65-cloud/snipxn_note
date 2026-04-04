module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
    '\\.html$': '<rootDir>/__mocks__/fileMock.js',
    '^react-native-reanimated$':
      '<rootDir>/node_modules/react-native-reanimated/mock.js',
    '^react-native-worklets$':
      '<rootDir>/node_modules/react-native-worklets/lib/module/mock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|@react-native-async-storage|react-native-device-info|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-svg|react-native-worklets|react-native-drawer-layout|react-native-pager-view|react-native-tab-view|react-native-webview|react-native-markdown-display|heroui-native|uniwind|tailwind-variants|tailwind-merge|uuid)/)',
  ],
};

