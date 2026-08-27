import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["node_modules/**", "dist/**", "build/**", "coverage/**", "logs/**", "uploads/**"]),

  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },

  {
    files: ["**/*.{js,mjs,cjs}"],

    extends: [js.configs.recommended],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "object-shorthand": ["error", "always"],
    },
  },

  {
    files: ["**/*.ts"],

    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.node,
      },

      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      "@typescript-eslint/no-explicit-any": "warn",

      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],

      "@typescript-eslint/no-floating-promises": "error",

      "@typescript-eslint/no-misused-promises": "error",

      "@typescript-eslint/await-thenable": "error",

      "@typescript-eslint/prefer-optional-chain": "warn",

      "@typescript-eslint/prefer-nullish-coalescing": "warn",

      "@typescript-eslint/no-unnecessary-condition": "warn",

      "@typescript-eslint/no-unnecessary-type-assertion": "warn",

      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        {
          ignoreArrowShorthand: true,
        },
      ],

      "no-debugger": "error",

      "no-var": "error",

      "prefer-const": "error",

      eqeqeq: ["error", "always"],

      curly: ["error", "all"],

      "object-shorthand": ["error", "always"],

      "no-console": "off",
    },
  },

  {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/tests/**/*.ts"],

    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },

  eslintConfigPrettier,
]);
