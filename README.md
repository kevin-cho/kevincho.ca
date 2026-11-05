# kevincho.ca

Kevin Cho's personal site: an introduction, links (GitHub, LinkedIn, email, resume), and a list of apps.

Built with [Next.js](https://nextjs.org) (App Router), React, TypeScript, and Tailwind CSS, deployed on [Vercel](https://vercel.com).

## How it fits together

- **This repo is the portal.** It holds the home page, lists the apps, and routes each app's path to it.
- **Each app lives in its own repo** and its own Vercel project, and is served under a path of `kevincho.ca` (e.g. `kevincho.ca/todo`) using [Next.js Multi-Zones](https://nextjs.org/docs/app/guides/multi-zones). Apps deploy independently.

## Adding an app

1. In the app's repo, set its base path to its URL path (for Next.js, `basePath: "/todo"` in `next.config.ts`), and deploy it as its own Vercel project.
2. In this repo, add rewrites in `next.config.ts` that send `/todo` and `/todo/:path+` to the app's public production URL, read from an env var (see the `MAPLESTORY_URL` rewrites for the pattern). Set the env var in this Vercel project for Production and Preview. It's read at build time, so redeploy afterwards.
3. Add an entry to [`src/data/apps.ts`](src/data/apps.ts):

   ```ts
   { name: "Todo", description: "A simple todo list", url: "/todo" },
   ```

App paths must not clash with this site's own pages.

Link to an app with a plain `<a>`, not `<Link>`: moving between apps is a full page load.

### Current apps

| Path | Repo | Env var | Production URL |
|---|---|---|---|
| `/maplestory` | [`kevin-cho/maplestory-app`](https://github.com/kevin-cho/maplestory-app) | `MAPLESTORY_URL` | `https://maplestory-app.vercel.app` |

Without the env var, the app's path is a 404 on this site, so builds and tests don't depend on the app.

The home page shows an "Apps" section as soon as the list has at least one entry.

## Development

Requires Node 24 (see `.nvmrc`; with nvm, run `nvm use`).

```bash
git submodule update --init   # checks out the mario-item-block game
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

If a CSS change doesn't show up in the dev server, stop it, delete the `.next/` folder, and start it again.

To see an app through this site locally, run the app's dev server too (the MapleStory app runs on port 3002) and point this site at it in `.env.local` (gitignored), then restart `npm run dev`:

```bash
MAPLESTORY_URL=http://localhost:3002
```

## Tests

End-to-end tests use [Playwright](https://playwright.dev) and live in `e2e/`. They run in headless Chromium against a fresh production build, which Playwright builds and starts on port 3100.

```bash
npx playwright install chromium   # once, downloads the test browser
npm run test:e2e                  # build, start, run the tests
npx playwright test --ui          # step through tests in Playwright's UI
```

Every test also fails if the page logs an error (see `e2e/fixtures.ts`).

## Project layout

- `src/app/` — pages, root layout, global styles (`globals.css` defines the light/dark color roles)
- `src/components/` — UI pieces (theme toggle, app list, icons)
- `src/data/apps.ts` — the apps listed on the home page
- `public/` — static files (resume PDF, photo)
- `public/mario-item-block/` — git submodule: the [Mario item block](https://github.com/kevin-cho/mario-item-block) game, embedded by the page at `src/app/mario-item-block/` (`/mario-item-block`)
- `e2e/` — Playwright end-to-end tests
- `docs/plans/` — step-by-step plans and their change logs
