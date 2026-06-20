const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Gradle/CMake build artifacts can appear/disappear mid-watch and crash Metro.
    blockList: [
      /node_modules\/.*\/android\/\.cxx\/.*/,
      /node_modules\/.*\/android\/build\/.*/,
      /android\/\.gradle\/.*/,
      /android\/app\/\.cxx\/.*/,
      /android\/app\/build\/.*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
