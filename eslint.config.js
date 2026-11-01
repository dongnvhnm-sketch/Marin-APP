import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      'coverage/**',
      '.aistudio/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        process: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-undef': 'off',
      'no-empty-pattern': 'warn',
    },
  },
];
