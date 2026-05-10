const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// SVGs chargés comme assets binaires → utilisables via useSVG de Skia
config.resolver.assetExts = [...config.resolver.assetExts, 'svg'];

module.exports = withNativeWind(config, { input: './global.css' });
