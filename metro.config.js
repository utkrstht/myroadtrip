const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');
const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Remove the custom sourceExts to use Expo's defaults
// Expo's default order properly handles platform-specific files:
// For mobile: .native.js, .ios.js, .android.js, .js
// For web: .web.js, .js
// This ensures .web.tsx files are only used on web platform

// Keep platforms in the correct priority order
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = wrapWithReanimatedMetroConfig(config);