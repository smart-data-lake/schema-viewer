import { defineConfig } from "eslint/config";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";
import react from "eslint-plugin-react";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import testingLibrary from "eslint-plugin-testing-library";

export default defineConfig([
  {
    ignores: ["node_modules/**", "dist/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
      },
    },
    plugins: {
      "@typescript-eslint": fixupPluginRules(tsPlugin),
      react: fixupPluginRules(react),
      "jsx-a11y": fixupPluginRules(jsxA11Y),
      "react-hooks": fixupPluginRules(reactHooks),
      "testing-library": fixupPluginRules(testingLibrary),
    },
    rules: {
      ...(tsPlugin.configs.recommended?.rules || {}),
      ...(react.configs.recommended?.rules || {}),
      ...(jsxA11Y.configs.recommended?.rules || {}),
      ...(reactHooks.configs.recommended?.rules || {}),
      "@typescript-eslint/no-explicit-any": "off",
       "testing-library/no-node-access": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);
