# AGENTS.md

## Cursor Cloud specific instructions

### Overview

SecondLife Exchange is a pnpm monorepo with three packages:

| Package                 | Path              | Description                                           |
| ----------------------- | ----------------- | ----------------------------------------------------- |
| `@secondlife/web`       | `apps/web`        | Next.js 15 App Router frontend (port 3000)            |
| `@secondlife/functions` | `apps/functions`  | Firebase Functions v2 backend (emulated on port 5001) |
| `@secondlife/shared`    | `packages/shared` | Shared Zod schemas & TypeScript types                 |

Standard dev commands are documented in the root `README.md`. Key commands: `pnpm lint`, `pnpm test`, `pnpm dev`, `pnpm dev:web`, `pnpm dev:functions`, `pnpm build`.

### Environment files (local dev)

- `apps/web/.env.local` — copy from `apps/web/.env.example`. Must set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` and include `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8082`, `FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199` for the Firebase Admin SDK to use emulators. `AUTH_SESSION_SECRET` needs a random 32+ char string (e.g. `openssl rand -base64 32`). Firebase Admin credentials can be dummy values when using emulators.
- `apps/functions/.env` — copy from `apps/functions/.env.example`. `PROJECT_ID` should match the emulator project name. AI keys are optional.

### Vendor shared dependency (functions)

The functions package uses `@secondlife/shared` as a vendored `file:vendor/shared` dependency (not a workspace link). Before `pnpm install` succeeds, the `vendor/shared` directory must exist. The build flow is:

1. `pnpm --filter @secondlife/shared build` (compiles TypeScript to `packages/shared/dist`)
2. `node apps/functions/scripts/prepare-shared-dep.mjs` (copies dist to `apps/functions/vendor/shared`)
3. `pnpm install` (resolves the file dependency)

If `vendor/shared` does not exist when running `pnpm install` for the first time, create a stub: `mkdir -p apps/functions/vendor/shared/dist && echo '{}' > apps/functions/vendor/shared/package.json`.

### Starting services

1. **Firebase emulators** (`pnpm dev:functions`): Requires Java (JDK 11+). The functions must be built first (`pnpm --filter @secondlife/functions build`) or the emulator will start but report "lib/index.js does not exist". The emulator auto-loads built functions from `apps/functions/lib/`.
2. **Next.js dev server** (`pnpm dev:web`): Runs on port 3000. Must start after emulators are up if using emulators.

### Known caveats

- The CSP config in `apps/web/next.config.ts` does not include `'unsafe-eval'` in `script-src` for dev mode. Next.js webpack dev mode requires `unsafe-eval` for HMR/fast-refresh. This causes client-side React hydration to fail in the browser. Server-side rendering and API routes work correctly. Backend API testing via curl or similar is unaffected.
- The `engines` field in `apps/functions/package.json` specifies `"node": "20"` (the Firebase Functions deploy target), but local development works with Node.js 22+. pnpm will emit a warning.
- When killing the Firebase emulators, lingering Java processes may hold ports (4000, 5001, 8082, 9099, 9199). Check with `netstat -tlnp | grep -E '(4000|5001|8082|9099|9199)'` and kill specific PIDs before restarting.

### Testing

- **Lint**: `pnpm lint` (runs ESLint across all packages)
- **Unit/integration tests**: `pnpm test` (runs vitest in functions, skips web e2e)
- **E2E tests**: `pnpm --filter @secondlife/web test:e2e:example` (requires Playwright browsers installed)
- **Format check**: `pnpm format:check`
