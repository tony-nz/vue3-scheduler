import pluginVue from "eslint-plugin-vue";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const nodeGlobals = {
  __dirname: "readonly", __filename: "readonly",
  Buffer: "readonly", clearImmediate: "readonly",
  clearInterval: "readonly", clearTimeout: "readonly",
  console: "readonly", exports: "writable",
  global: "readonly", module: "readonly",
  process: "readonly", require: "readonly",
  setImmediate: "readonly", setInterval: "readonly",
  setTimeout: "readonly", URL: "readonly",
  URLSearchParams: "readonly",
};

const isProd = process.env.NODE_ENV === "production";

// vue-eslint-parser is a transitive dep of eslint-plugin-vue; extract the reference
// from the already-resolved flat config rather than importing it directly.
const vueEslintParser = pluginVue.configs["flat/essential"][1].languageOptions.parser;

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: ["dist/**", "build/**", "node_modules/**", ".git/**"],
  },

  // Vue 3 essential rules + vue-eslint-parser for .vue files
  ...pluginVue.configs["flat/essential"],

  // TypeScript recommended rules
  ...tsPlugin.configs["flat/recommended"],

  // Re-assert vue-eslint-parser for .vue files after TS spread; wire in tsParser for script blocks
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: nodeGlobals,
    },
  },

  // TypeScript parser for .ts/.js source files
  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: nodeGlobals,
    },
  },

  // Custom rule overrides (applied globally)
  {
    rules: {
      "no-console": isProd ? "warn" : "off",
      "no-debugger": isProd ? "warn" : "off",
      "vue/multi-word-component-names": "off",
      "vue/no-reserved-component-names": [
        "error",
        {
          disallowVueBuiltInComponents: false,
          disallowVue3BuiltInComponents: false,
        },
      ],
    },
  },
];
