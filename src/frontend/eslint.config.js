// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist']
  },
  {
    extends: [js.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'semi': 'off',
      '@typescript-eslint/semi': ['error', 'never'],

      // --- 设置最大换行字数 ---
      'max-len': [
        'error', // 或者 'warn'，表示违反规则时是报错还是警告
        {
          'code': 200, // 代码行的最大长度，这里设置为 100 个字符
          'tabWidth': 4, // 指定 tab 的宽度，ESLint 会根据这个来计算行长
          'ignoreComments': true, // 忽略行内注释的长度
          'ignoreTrailingComments': true, // 忽略行尾注释的长度
          'ignoreUrls': true, // 忽略 URL 的长度
          'ignoreStrings': true, // 忽略字符串字面量的长度
          'ignoreTemplateLiterals': true, // 忽略模板字符串的长度
          'ignoreRegExpLiterals': true, // 忽略正则表达式字面量的长度
        }
      ],
      // 可以在 `max-len` 中为注释单独设置长度限制，例如：
      // 'max-len': [
      //   'error',
      //   {
      //     'code': 100,
      //     'comments': 80, // 注释行的最大长度，例如设置为 80
      //     'ignoreUrls': true,
      //     // ...其他忽略选项
      //   }
      // ],


      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
);