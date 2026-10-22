module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: 'detect' } },
  plugins: ['react-refresh'],
  rules: {
    'react/prop-types': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  overrides: [
    {
      // Build/config files run in Node, not the browser.
      files: ['vite.config.js', 'tailwind.config.js', 'postcss.config.js', '.eslintrc.cjs'],
      env: { node: true, browser: false },
    },
  ],
  ignorePatterns: ['dist', 'node_modules'],
};
