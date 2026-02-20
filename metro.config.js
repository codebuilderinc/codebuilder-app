const path = require('path');

let config;
try {
  const { getSentryExpoConfig } = require('@sentry/react-native/metro');
  config = getSentryExpoConfig(__dirname);
} catch (e) {
  const { getDefaultConfig } = require('expo/metro-config');
  config = getDefaultConfig(__dirname);
}

config.resolver = config.resolver || {};
config.resolver.alias = Object.assign({}, config.resolver.alias || {}, {
  '@': path.resolve(__dirname),
});

config.resolver.sourceExts = Array.from(new Set([...(config.resolver.sourceExts || []), 'ts', 'tsx']));

module.exports = config;