import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import promise from "eslint-plugin-promise";
import sonarjs from "eslint-plugin-sonarjs";

export default [
  {
    ignores: ["dist/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      promise,
      sonarjs,
    },
    rules: {
      ...react.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      ...promise.configs["flat/recommended"].rules,
      ...sonarjs.configs.recommended.rules,

      "sonarjs/cognitive-complexity": ["error", 20],

      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",

      "react/jsx-no-leaked-render": "error",
      "react/no-unused-state": "error",
      "react/no-typos": "error",
      "react/button-has-type": "error",

      eqeqeq: ["error", "smart"],
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "warn",

      "react/no-array-index-key": "warn",
      "react/no-unstable-nested-components": "warn",
    },
  },
];
