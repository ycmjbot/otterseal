import { defineConfig } from 'vitest/config';

/**
 * Root vitest config for the monorepo
 * Each package has its own vitest.config.ts for flexibility
 * This serves as a base/documentation
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'build'],
  },
});
