# SecondLife Exchange

SecondLife Exchange is a web platform for cash-free exchange of second-hand objects, driven by a weekly theme and AI suggestions.

## Status

- Step 1 completed:
  - pnpm monorepo
  - Next.js App Router web app
  - Firebase Functions app
  - shared Zod package
  - base lint/format/husky setup
  - firebase config, rules, indexes
- Step 2 completed:
  - Firebase email/password auth flow (sign up, sign in, sign out)
  - secure server session cookie in Next.js
  - protected routes with Next middleware
  - admin RBAC on UI and Functions
  - Firestore security rules hardened to prevent role escalation
- Step 3 completed:
  - items CRUD HTTP endpoints in Firebase Functions
  - paginated item listing with filters
  - item detail endpoint with media subcollection
  - archive flow for items
  - image upload to Firebase Storage + media registration endpoint
  - `/items` UI pages (list/create/detail/edit)
  - client and server validation with shared Zod schemas
- Step 4 completed:
  - themeWeek HTTP endpoints in Firebase Functions
  - current theme resolution endpoint
  - paginated theme list endpoint
  - admin create/schedule theme endpoint
  - overlap prevention when scheduling a new week range
  - `/theme` user page
  - `/admin/themes` admin management page
- Step 5 completed:
  - scheduler now generates weekly AI suggestions from active theme and stores unpublished documents
  - strict JSON AI output validation with shared Zod schema
  - diversity checks enforced before persisting (vintage, artisanal, distinct category hints)
  - moderation API for pending suggestions (approve/publish and delete)
  - `/suggestions` published weekly suggestions page
  - `/admin/suggestions` generation and moderation page
- Step 6 completed:
  - eco-discover domain implemented (list filters, detail view, pagination)
  - anonymous eco view tracking persisted in `ecoViews`
  - admin eco content management page and endpoints
  - unit and integration tests added in Functions package
  - Playwright e2e example added for web package
  - service worker registration and offline fallback implemented
  - seed script added (themes, ecoContents, admin placeholder)
  - security headers tightened and docs finalized

## Monorepo

```text
.
|- apps/
|  |- web/         # Next.js frontend
|  `- functions/   # Firebase Functions backend
|- packages/
|  `- shared/      # Shared Zod schemas and types
`- firebase config + security rules
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Firebase CLI (`firebase-tools`)
- Firebase project

## Installation

```bash
pnpm install
```

## Environment Variables

### Web (`apps/web/.env.local`)

Copy from `apps/web/.env.example`.

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`
- `NEXT_PUBLIC_FUNCTIONS_BASE_URL`
- `AUTH_SESSION_SECRET` (min 32 chars)
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

### Functions (`apps/functions/.env`)

Copy from `apps/functions/.env.example`.

- `FIREBASE_PROJECT_ID`
- `AI_PROVIDER=gemini`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `OPENAI_API_KEY` (only if `AI_PROVIDER=openai`)
- `OPENAI_MODEL`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `SEED_ADMIN_UID`
- `SEED_ADMIN_EMAIL`

## Firebase Setup

1. Configure `.firebaserc` project id.
2. Enable Firebase Authentication (email/password).
3. Enable Firestore, Storage, Functions.
4. Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Scripts

### Root

```bash
pnpm dev
pnpm dev:web
pnpm dev:functions
pnpm seed:dev
pnpm build
pnpm lint
pnpm test
pnpm format
pnpm format:check
```

### Web

```bash
pnpm --filter @secondlife/web dev
pnpm --filter @secondlife/web build
pnpm --filter @secondlife/web lint
pnpm --filter @secondlife/web test:e2e:example
```

### Functions

```bash
pnpm --filter @secondlife/functions dev
pnpm --filter @secondlife/functions build
pnpm --filter @secondlife/functions lint
pnpm --filter @secondlife/functions test
pnpm --filter @secondlife/functions seed:dev
```

### Shared

```bash
pnpm --filter @secondlife/shared build
pnpm --filter @secondlife/shared lint
```

## Auth And RBAC

- Client auth uses Firebase Auth email/password.
- `POST /api/auth/session` validates Firebase ID token with Firebase Admin.
- Server issues signed httpOnly cookie (`sl_session`).
- `middleware.ts` protects:
  - `/dashboard/**` -> requires auth
  - `/admin/**` -> requires admin role
  - `/items/**` -> requires auth
  - `/theme/**` -> requires auth
  - `/suggestions/**` -> requires auth
  - `/eco-discover/**` -> requires auth
- Admin role is read from `users/{uid}.role`.
- Functions enforce token verification and role checks:
  - `getSessionContext`
  - `getMyProfile`
  - `upsertMyProfile`
  - `adminListUsers` (admin only)

## Items API (Step 3)

Functions endpoints:

- `createItem` (`POST`) -> create item
- `listItems` (`GET`) -> list paginated items (`limit`, `cursor`, `status`, `mine`)
- `getItemDetail` (`GET`) -> item + media (`itemId`)
- `updateItem` (`POST`) -> update mutable fields
- `archiveItem` (`POST`) -> set status to `archived`
- `addItemMedia` (`POST`) -> attach uploaded media metadata

Web routes:

- `/items`
- `/items/new`
- `/items/[itemId]`
- `/items/[itemId]/edit`

## Themes API (Step 4)

Functions endpoints:

- `getCurrentThemeWeek` (`GET`) -> current active theme or `null`
- `listThemeWeeks` (`GET`) -> paginated week list (`limit`, `cursor`)
- `createThemeWeek` (`POST`) -> admin-only create/schedule

Web routes:

- `/theme`
- `/admin/themes`

## AI Suggestions API (Step 5)

Functions endpoints:

- `listPublishedAiSuggestions` (`GET`) -> paginated published suggestions
- `listPendingAiSuggestions` (`GET`) -> admin-only paginated unpublished suggestions
- `approveAiSuggestion` (`POST`) -> admin-only publish action
- `deleteAiSuggestion` (`POST`) -> admin-only rejection/delete action
- `adminGenerateWeeklySuggestions` (`POST`) -> admin-only on-demand generation
- `generateWeeklySuggestions` (scheduled) -> weekly automatic generation

Web routes:

- `/suggestions`
- `/admin/suggestions`

## Eco Discover API (Step 6)

Functions endpoints:

- `listEcoContents` (`GET`) -> list paginated eco contents with filters (`type`, `tag`, `themeWeekId`, `lang`)
- `getEcoContentDetail` (`GET`) -> eco content detail by `contentId`
- `trackEcoView` (`POST`) -> anonymous eco view tracking (`contentId`, `themeWeekId`, `timestamp`)
- `adminListEcoContents` (`GET`) -> admin-only eco content list
- `adminCreateEcoContent` (`POST`) -> admin-only create eco content

Web routes:

- `/eco-discover`
- `/eco-discover/[contentId]`
- `/admin/eco-contents`

## Testing (Step 6)

Functions tests:

- Unit: `apps/functions/src/features/ai-suggestions/diversity.test.ts`
- Integration: `apps/functions/src/features/eco/http.integration.test.ts`

Web e2e example:

- `apps/web/e2e/smoke.spec.ts`

## Seed Script

Seed development data:

```bash
pnpm seed:dev
```

Seed writes:

- admin user placeholder (`users/{SEED_ADMIN_UID}`)
- current week theme
- sample eco contents

## PWA

- Manifest: `apps/web/public/manifest.webmanifest`
- Service worker: `apps/web/public/sw.js`
- SW registration: `apps/web/src/components/pwa/sw-register.tsx`
- Offline fallback route: `/offline`

## Security Notes

- Security headers set in `apps/web/next.config.ts`.
- Same-origin check on auth session/logout API routes.
- Rate limiting on sensitive functions routes.
- Strict Firestore rules:
  - users can create their own user doc only as role `user`
  - users cannot update their role
  - admin-only updates on `/users/{uid}`
- Storage rules enforce owner path + image type + size limit.
- Item image constraints:
  - max 10 images per item
  - max 5MB per image
  - allowed: JPEG, PNG, WEBP

## Current Gaps (after Step 6)

- No push notifications implemented.
- No background sync queue for offline mutations yet.

## Assumptions

- pnpm is the workspace package manager.
- Functions region remains `europe-west1`.
- Session strategy for Next middleware is custom signed cookie derived from verified Firebase token.
- Admin users are managed by setting `users/{uid}.role = "admin"` from trusted admin tooling.
- Item media binary upload is done directly from web client to Firebase Storage, then registered in Firestore via `addItemMedia`.
- Web e2e suite is an example starter and may require local app bootstrapping before execution.
