// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Supabase JS imports @opentelemetry/api which doesn't exist in
// React Native / Expo web environments. We stub it out here.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@opentelemetry/api': require.resolve('./shims/opentelemetry-shim.js'),
};

module.exports = config;