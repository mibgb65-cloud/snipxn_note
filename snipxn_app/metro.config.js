const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const baseConfig = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(
  mergeConfig(baseConfig, {}),
  {
    cssEntryFile: './src/global.css',
    dtsFile: './src/uniwind-types.d.ts',
  },
);
