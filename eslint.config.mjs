import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next"; // ✅ Correct import

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,tsx}"] }, // Ensure it applies to all files
  { files: ["**/*.js"], languageOptions: { sourceType: "script" } },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin.configs.recommended, // ✅ Correct way to add Next.js plugin
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Disable rule
    },
  },
];
