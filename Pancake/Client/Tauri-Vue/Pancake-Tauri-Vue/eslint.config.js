import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "src-tauri"]),

  // 纯 TypeScript 文件
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },

  // Vue 单文件组件 — 必须显式指定 TS parser，
  // 否则 vue-eslint-parser 会用默认的 espree 解析 <script lang="ts">，导致类型语法报错
  {
    files: ["**/*.vue"],
    extends: [js.configs.recommended, tseslint.configs.recommended, ...pluginVue.configs["flat/recommended"]],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser, // 告诉 vue-eslint-parser：<script lang="ts"> 用 TypeScript parser
      },
    },
  },

  eslintConfigPrettier, // 关掉所有和 Prettier 冲突的格式规则
]);
