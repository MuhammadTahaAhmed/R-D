import js from '@eslint/js';
import globals from 'globals';
import babelParser from '@babel/eslint-parser';

export default [
  // Ignore generated/output directories entirely
  { ignores: ['.next/**', '**/.next/**', 'node_modules/**', 'dist/**', 'build/**', '.turbo/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Add any custom rules here
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-case-declarations': 'off'
    },
  },
];
