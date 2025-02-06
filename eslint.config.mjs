import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginJest from "eslint-plugin-jest"; // Import the Jest plugin
import globals from "globals";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node, // Add Node.js globals
      },
    },
    plugins: {
      js: pluginJs,
      react: pluginReact,
      jest: pluginJest, // Add the Jest plugin
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginReact.configs.flat.recommended.rules,
      ...pluginJest.configs.recommended.rules, // Add the Jest plugin rules
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
  {
    files: ["**/*.test.js", "**/*.spec.js"], // Apply Jest environment to test files
    languageOptions: {
      globals: {
        ...globals.jest, // Add Jest globals
      },
    },
  },
];