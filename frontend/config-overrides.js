module.exports = function override(config, env) {
  // Suppress source-map-loader warnings for missing source maps in node_modules
  config.ignoreWarnings = [
    (warning) =>
      typeof warning.message === 'string' &&
      warning.message.includes('Failed to parse source map'),
  ];
  return config;
};
