const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

config.resolver.alias = {
  "@": __dirname,
};

config.resolver.sourceExts = [...config.resolver.sourceExts, "ts", "tsx"];

module.exports = config;