const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add 'cjs' to sourceExts
defaultConfig.resolver.sourceExts.push('cjs');

// Disable unstable_enablePackageExports to fix module resolution
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
