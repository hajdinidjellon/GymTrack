/**
 * LICENCES OPEN SOURCE — dépendances runtime de l'app.
 *
 * Généré depuis package.json + node_modules (licence réelle de chaque paquet).
 * À régénérer quand les dépendances changent :
 *
 *   node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 *     console.log(Object.keys(pkg.dependencies).sort().map(n=>{
 *       const p=JSON.parse(fs.readFileSync('node_modules/'+n+'/package.json','utf8'));
 *       return {name:n,version:p.version,license:typeof p.license==='string'?p.license:p.license?.type};
 *     }))"
 *
 * Toutes les licences sont permissives (MIT / OFL-1.1) — aucune GPL.
 */

export type OssLicense = {
  name: string;
  version: string;
  license: string;
};

export const OSS_LICENSES: OssLicense[] = [
  { name: '@expo-google-fonts/inter', version: '0.4.2', license: 'MIT + OFL-1.1' },
  { name: '@expo-google-fonts/rajdhani', version: '0.4.1', license: 'MIT + OFL-1.1' },
  { name: '@expo/metro', version: '55.1.1', license: 'MIT' },
  { name: '@react-native-async-storage/async-storage', version: '2.2.0', license: 'MIT' },
  { name: '@react-native-community/netinfo', version: '11.4.1', license: 'MIT' },
  { name: '@shopify/react-native-skia', version: '2.2.12', license: 'MIT' },
  { name: '@supabase/supabase-js', version: '2.105.4', license: 'MIT' },
  { name: 'aes-js', version: '3.1.2', license: 'MIT' },
  { name: 'date-fns', version: '3.6.0', license: 'MIT' },
  { name: 'expo', version: '54.0.34', license: 'MIT' },
  { name: 'expo-audio', version: '1.1.1', license: 'MIT' },
  { name: 'expo-blur', version: '15.0.8', license: 'MIT' },
  { name: 'expo-constants', version: '18.0.13', license: 'MIT' },
  { name: 'expo-crypto', version: '15.0.9', license: 'MIT' },
  { name: 'expo-file-system', version: '19.0.23', license: 'MIT' },
  { name: 'expo-font', version: '14.0.11', license: 'MIT' },
  { name: 'expo-haptics', version: '15.0.8', license: 'MIT' },
  { name: 'expo-image', version: '3.0.11', license: 'MIT' },
  { name: 'expo-linear-gradient', version: '15.0.8', license: 'MIT' },
  { name: 'expo-linking', version: '8.0.12', license: 'MIT' },
  { name: 'expo-notifications', version: '0.32.17', license: 'MIT' },
  { name: 'expo-router', version: '6.0.24', license: 'MIT' },
  { name: 'expo-secure-store', version: '15.0.8', license: 'MIT' },
  { name: 'expo-sharing', version: '14.0.8', license: 'MIT' },
  { name: 'expo-sqlite', version: '16.0.10', license: 'MIT' },
  { name: 'expo-status-bar', version: '3.0.9', license: 'MIT' },
  { name: 'expo-system-ui', version: '6.0.9', license: 'MIT' },
  { name: 'expo-web-browser', version: '15.0.11', license: 'MIT' },
  { name: 'moti', version: '0.30.0', license: 'MIT' },
  { name: 'nativewind', version: '4.2.3', license: 'MIT' },
  { name: 'phosphor-react-native', version: '3.0.6', license: 'MIT' },
  { name: 'react', version: '19.1.0', license: 'MIT' },
  { name: 'react-dom', version: '19.1.0', license: 'MIT' },
  { name: 'react-native', version: '0.81.5', license: 'MIT' },
  { name: 'react-native-gesture-handler', version: '2.28.0', license: 'MIT' },
  { name: 'react-native-reanimated', version: '4.1.7', license: 'MIT' },
  { name: 'react-native-safe-area-context', version: '5.6.2', license: 'MIT' },
  { name: 'react-native-screens', version: '4.16.0', license: 'MIT' },
  { name: 'react-native-svg', version: '15.12.1', license: 'MIT' },
  { name: 'react-native-url-polyfill', version: '2.0.0', license: 'MIT' },
  { name: 'react-native-web', version: '0.21.2', license: 'MIT' },
  { name: 'react-native-worklets', version: '0.5.1', license: 'MIT' },
  { name: 'zustand', version: '5.0.13', license: 'MIT' },
];
