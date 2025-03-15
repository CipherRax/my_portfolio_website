import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next"; // Import Next.js plugin

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,tsx}"] }, // Added tsx
  { files: ["**/*.js"], languageOptions: { sourceType: "script" } },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin.configs.recommended, // ✅ Add Next.js plugin
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Disables the rule
    },
  },
];
