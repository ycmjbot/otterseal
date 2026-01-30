# SecurePad TypeScript Migration Plan

## 1. Preparation
- [ ] Install dev dependencies in workspace root:
  - `typescript`
  - `@types/node`
  - `@types/react`
  - `@types/react-dom`
- [ ] Create `tsconfig.base.json` in root.

## 2. Shared Package (`packages/shared`)
- [ ] Add `tsconfig.json` extending base.
- [ ] Rename `src/index.js` -> `src/index.ts`.
- [ ] Add types for Web Crypto API (via `lib: ["dom"]` or `@types/node`).
- [ ] Update `package.json`:
  - point `main` to `dist/index.js`
  - point `types` to `dist/index.d.ts`
  - add `build` script (`tsc`).

## 3. Server (`apps/server`)
- [ ] Install `@types/express`.
- [ ] Add `tsconfig.json`.
- [ ] Rename `server.js` -> `server.ts`.
- [ ] Update imports to use `packages/shared`.
- [ ] Setup `ts-node` or `tsx` for development execution.
- [ ] Update build script (tsc -> dist).

## 4. Client (`apps/client`)
- [ ] Add `tsconfig.json` (Vite template style).
- [ ] Rename `vite.config.js` -> `vite.config.ts`.
- [ ] Rename source files:
  - `.js` -> `.ts`
  - `.jsx` -> `.tsx`
- [ ] Fix type errors (React props, event handlers).
- [ ] Verify `packages/shared` import works.

## 5. CLI (`apps/cli`)
- [ ] Add `tsconfig.json`.
- [ ] Refactor `bin/securepad.js` to TypeScript source structure (e.g. `src/index.ts`).
- [ ] Use `tsx` or `ts-node` for execution.
