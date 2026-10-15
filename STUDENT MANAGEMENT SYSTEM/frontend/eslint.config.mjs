import tseslint from 'typescript-eslint';

export default tseslint.config({
  ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  files: ['src/**/*.{ts,tsx}'],
  extends: [tseslint.configs.recommended],
});
