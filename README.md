# DineInk — Owner Web

The dashboard a restaurant owner signs into: billing, inventory, customers,
staff, kitchen operations, financial analytics and the AI advisor. Plus the
public marketing pages (home, pricing, features, contact, legal) served from the
same app.

React 19 + TypeScript on Vite, Tailwind 4, Redux Toolkit, React Router 7.
Deployed on Vercel; talks to the DineInk backend at `/api/*`.

```
   owner-web (this app)          internal-web              POS
        │                             │                     │
        └──────────────┬──────────────┴─────────────────────┘
                       ▼
              DineInk backend  (dineink-backend)
                       ▼
                   Postgres
```

## Running it

```bash
npm install
cp .env.example .env     # then point VITE_API_URL at your backend
npm run dev              # http://localhost:5173
```

The backend must be running separately (`dineink-backend`, port 5500 locally).
`internal-web` runs on 5175, so all three can run side by side.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm test` | Unit tests (vitest + testing-library) |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run lint` | ESLint |

## Environment

Every variable is `VITE_*`, which Vite **inlines into the client bundle**. They
are public once the app ships — never put a secret in one. See `.env.example`.

## Layout

```
src/
  App.tsx · main.tsx     Entry point
  routes/                Route table + the auth guards
                         (AppRoutes lazy-loads every page — see the note there)
  layouts/               DashboardLayout — the authenticated shell
  pages/<feature>/       One folder per feature; tabs and charts co-located
  components/
    common/              Genuinely shared (Navbar, Footer, tables, dropdowns)
    home/                Marketing-page sections
    dashboard/, bills/   Feature-specific components
  design/                The design system — tokens, components, hooks
  store/                 Redux: slices/ for client state, api/ for RTK Query
  hooks/ · utils/        Shared hooks and helpers
  types/ · data/         Shared types and static data
  test/                  setupTests + test-utils (makeTestStore)
```

### Conventions

- **Pages are feature-first.** A feature owns its folder and co-locates what only
  it uses — see `pages/forecast/` (tabs, charts, categories) or
  `pages/banking/types.ts`.
- **Use the design system.** `src/design/` is the source of buttons, inputs,
  dialogs, tables and layout primitives. 34 files import it; don't hand-roll a
  button.
- **Tests sit next to what they test** (`Login.test.tsx` beside `Login.tsx`).
- **Routes are lazy.** Every page in `routes/AppRoutes.tsx` is behind
  `React.lazy` — an anonymous visitor to the marketing page must not download
  the whole dashboard.

## Known direction

Two things a newcomer should know before adding code, because the codebase is
mid-transition and the majority pattern is not the intended one:

**Data fetching is moving to RTK Query.** Today ~71 components call `fetch()`
directly and re-implement loading, error and cache handling inline; only one
uses the RTK Query layer that already exists in `store/api/`. New screens should
add an endpoint to `store/api/` rather than calling `fetch`. `internal-web` is
the reference — it does this for all 14 of its API groups.

**TypeScript is not yet strict.** `tsconfig.json` has `"strict": false`. Write
new code as if it were on (no implicit `any`, handle nulls); turning it on is a
known, scoped piece of work.
