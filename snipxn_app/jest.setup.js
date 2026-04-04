require('react-native-gesture-handler/jestSetup');

jest.mock('react-native/src/private/animated/NativeAnimatedHelper');
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(async () => false),
  setGenericPassword: jest.fn(async () => true),
  resetGenericPassword: jest.fn(async () => true),
}));
jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(async () => 'test-device-id'),
  getDeviceName: jest.fn(async () => 'Test Android'),
  getVersion: jest.fn(() => '0.0.1'),
  getBuildNumber: jest.fn(() => '1'),
}));
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(async () => ({
    isConnected: true,
    isInternetReachable: true,
  })),
}));
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));
jest.mock('react-native-document-picker', () => {
  const mockModule = {
    pickSingle: jest.fn(async () => {
      throw { code: 'DOCUMENT_PICKER_CANCELED' };
    }),
    pick: jest.fn(async () => []),
    isCancel: jest.fn(error => Boolean(error) && typeof error === 'object' && error.code === 'DOCUMENT_PICKER_CANCELED'),
    types: {
      json: 'application/json',
      plainText: 'text/plain',
    },
  };

  return {
    __esModule: true,
    ...mockModule,
    default: mockModule,
  };
});
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(async () => undefined),
  isVisible: jest.fn(() => false),
}));
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockWebView = React.forwardRef((props, ref) =>
    React.createElement(View, {
      ...props,
      ref,
    })
  );

  return {
    __esModule: true,
    WebView: MockWebView,
    default: MockWebView,
  };
});
jest.mock('@op-engineering/op-sqlite', () => {
  const createMockDb = () => ({
    executeSync: jest.fn(() => ({ rowsAffected: 0, rows: [] })),
    execute: jest.fn(async () => ({ rowsAffected: 0, rows: [] })),
    executeBatch: jest.fn(async () => ({ rowsAffected: 0 })),
    close: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(async fn => {
      await fn({
        execute: jest.fn(async () => ({ rowsAffected: 0, rows: [] })),
        commit: jest.fn(async () => ({ rowsAffected: 0, rows: [] })),
        rollback: jest.fn(() => ({ rowsAffected: 0, rows: [] })),
      });
    }),
  });

  return {
    open: jest.fn(() => createMockDb()),
  };
});




