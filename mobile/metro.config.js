const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Racine du monorepo
const monorepoRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(__dirname);

// Metro doit surveiller les fichiers à la racine
config.watchFolders = [monorepoRoot];

// Résolution des modules : d'abord local, puis racine
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Fix pour les packages qui utilisent des imports relatifs internes (./)
// Force Metro à résoudre depuis le dossier du module lui-même
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
