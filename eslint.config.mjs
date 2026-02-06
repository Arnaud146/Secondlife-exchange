import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import securityPlugin from "eslint-plugin-security";

export default [
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/lib/**", "**/.firebase/**"],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
      import: importPlugin,
      security: securityPlugin,
    },
    rules: {
      "import/no-unresolved": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
        },
      ],
    },
  },
];
