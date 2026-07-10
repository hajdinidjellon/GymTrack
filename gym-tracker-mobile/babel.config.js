/** @type {import('@babel/core').ConfigFunction} */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
    env: {
      // Jest (Node) ne sait pas exécuter les import() dynamiques :
      // on les transforme en require() uniquement pour les tests.
      test: {
        plugins: ['babel-plugin-dynamic-import-node'],
      },
    },
  };
};
