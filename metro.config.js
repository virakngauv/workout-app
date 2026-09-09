const { getDefaultConfig } = require('expo/metro-config');

// Keep Expo's defaults. Add TV-specific file resolution only when a feature needs it.
module.exports = getDefaultConfig(__dirname);
