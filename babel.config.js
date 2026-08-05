module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 1. MUST-HAVE: This plugin is often required for reanimated (a common dependency) 
      // and helps with module resolution in general.
      'react-native-reanimated/plugin',
      
      // 2. OPTIONAL BUT RECOMMENDED: This can sometimes help with the 'import' issue
      // by ensuring runtime features are handled correctly.
      '@babel/plugin-transform-runtime' 
    ],
  };
};