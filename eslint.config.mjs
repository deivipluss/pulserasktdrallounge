import { FlatCompat } from "@eslint/eslintrc";

// Use the workspace root as base directory to avoid relying on __dirname in ESM
const compat = new FlatCompat({
  baseDirectory: process.cwd(),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
