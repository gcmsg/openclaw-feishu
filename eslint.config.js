import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  // 忽略的文件
  {
    ignores: ["node_modules/**", "dist/**", "**/*.js", "**/*.d.ts"],
  },

  // 基础规则
  eslint.configs.recommended,

  // TypeScript 规则
  ...tseslint.configs.recommended,

  // Prettier 兼容（禁用冲突规则）
  prettier,

  // 项目自定义规则
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 允许 any 类型（插件开发常需要）
      "@typescript-eslint/no-explicit-any": "off",

      // 允许未使用的变量（以 _ 开头）
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // 强制使用 const
      "prefer-const": "error",

      // 禁止 console.log（但允许 warn/error/info）
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],

      // 要求使用 === 和 !==
      eqeqeq: ["error", "always"],

      // 禁止未使用的表达式
      "no-unused-expressions": "error",
    },
  }
);
