import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', './vitest.config.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
        parser: tseslint.parser,
        parserOptions: {
            project: [
                './tsconfig.json',
                './tsconfig.app.json',
                './tsconfig.node.json',
            ],
        },
    },
      rules: {
          '@typescript-eslint/no-explicit-any': 'off',
          'react-hooks/exhaustive-deps': 'warn',
      },
  },
])
