const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // lucide-react-native ships ESM as .mjs; Metro must treat that as a source ext.
    sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs'],
    // Gradle/CMake build artifacts can appear/disappear mid-watch and crash Metro.
    blockList: [
      /node_modules\/.*\/android\/\.cxx\/.*/,
      /node_modules\/.*\/android\/build\/.*/,
      /android\/\.gradle\/.*/,
      /android\/app\/\.cxx\/.*/,
      /android\/app\/build\/.*/,
    ],
    // Prefer CJS for lucide — package "react-native" export points at .mjs barrels
    // that Metro fails to resolve for nested ./icons/*.mjs imports.
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'lucide-react-native') {
        return {
          filePath: path.resolve(
            __dirname,
            'node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
          ),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
