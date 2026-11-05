# Plan 05: Serve the MapleStory tools app at kevincho.ca/maplestory

**Status:** 🚧 In progress (2026-11-04) · **Branch:** `maplestory-zone` (from `master`) · **Started:** 2026-11-04

## Context
[`kevin-cho/maplestory-app`](https://github.com/kevin-cho/maplestory-app) is a separate Next.js app (MapleStory Classic calculators and simulators), built as a zone for this portal: `basePath: "/maplestory"`, the same Next.js version, and a copy of this site's theme files. It's deployed as its own Vercel project and is public at `https://maplestory-app.vercel.app/maplestory`. Its team domain, `maplestory-app-kevin-cho.vercel.app`, is behind a Vercel login, so it can't be used here.

The README's "Adding an app" section describes the Multi-Zones setup, but the rewrite was "not set up yet". **This is the first app, so this plan sets it up.** The app's own plan is `maplestory-app/docs/plans/01-base-app.md`, Step 6.

### Decisions
| Decision | Choice | Why |
|---|---|---|
| Routing | `rewrites()` in `next.config.ts`, as **`beforeFiles`**: `/maplestory` and `/maplestory/:path+` → the zone's URL with the same path | This is the setup the Next.js multi-zones guide uses (`node_modules/next/dist/docs/01-app/02-guides/multi-zones.md`). The zone uses `basePath` rather than `assetPrefix`, so its `_next` assets are already under `/maplestory/` and need no extra rule. They must be `beforeFiles`: as plain (afterFiles) rewrites, the zone's segment prefetches 404ed on Vercel (see Step 1). Kevin chose to try this over turning off `partialPrefetching` in the zone, 2026-11-04. |
| Zone URL | Env var `MAPLESTORY_URL`, with the rewrites skipped when it's unset | Production and previews point at `https://maplestory-app.vercel.app`, and local dev can point at `http://localhost:3002`. Builds and CI don't need the zone. Decided in the app's plan, 2026-11-04. |
| Listing | An entry in `src/data/apps.ts` | The home page's "Apps" section appears once the list has an entry. `AppList` already uses a plain `<a>`, which cross-zone links need. |
| Tests | The existing home test "lists the apps…" already checks each app's link and `href` | It covers the new entry with no new test. The zone itself is tested in its own repo. |

---

## Step 1: Rewrites, app entry and README ✅ Done on the preview (commits `29c8103`, `a5f2d8a`); not merged yet
- **Requirement:**
  - `kevincho.ca/maplestory` and every path under it serve the zone.
  - The home page lists "MapleStory Classic Tools".
  - The README explains the setup.
- **How:**
  - `next.config.ts`: add `rewrites()` driven by `MAPLESTORY_URL`.
  - `src/data/apps.ts`: add `{ name: "MapleStory Classic Tools", description: …, url: "/maplestory" }`.
  - `README.md`: replace "Not set up yet" with the real setup, and add a local-dev note (`.env.local`).
- **Kevin:** in the Vercel project `kevincho-portal`, add `MAPLESTORY_URL = https://maplestory-app.vercel.app` for Production and Preview. `next.config.ts` reads it at build time, so it applies from the next deploy.
- **Verify:**
  - **Locally:** the portal dev server on port 3000 with `MAPLESTORY_URL=http://localhost:3002`, and the zone's dev server on 3002.
    - `/maplestory` and the tool pages load through port 3000.
    - The app card and the zone's back arrow move between the two sites.
    - The theme choice carries across.
  - **Checks:** `npm run lint` and `npm run test:e2e` pass.
  - **Vercel:** the branch preview, then production after merging.
- **Result (2026-11-04):**
  - **Code:**
    - `next.config.ts` has `rewrites()` for `/maplestory` and `/maplestory/:path+`, and returns none when `MAPLESTORY_URL` is unset.
    - `apps.ts` lists "MapleStory Classic Tools".
    - The README's "Adding an app" section now describes the real setup, with a "Current apps" table and a local-dev note about `.env.local`.
  - **Local check:** portal `next dev` on 3000 with `MAPLESTORY_URL=http://localhost:3002`, and the zone's dev server on 3002.
    - The home page shows the "Apps" section with the card, linking to `/maplestory`.
    - Clicking it does a full page load to `localhost:3000/maplestory`, which renders the zone.
    - Every zone file (pages, `/maplestory/_next/...` chunks, CSS and fonts) loads through port 3000 with status 200, and nothing loads from another origin.
    - Card navigation inside the zone works (`/maplestory/scroll`).
    - Switching to light mode in the zone and pressing the back arrow lands on `localhost:3000/` still in light mode, with the shared `localStorage["theme"]`.
    - One leftover console 404 matched no request in the network log. It'll be rechecked on the Vercel preview (production builds).
  - **Checks:** `npm run lint`, `tsc --noEmit` and `npm run test:e2e` pass (14 tests). "Lists the apps" now checks the new card.
  - **Remaining:**
    - Kevin sets `MAPLESTORY_URL` in Vercel.
    - Commit and push the branch.
    - Check the preview, then merge and check production.
- **Preview check (2026-11-04, commit `29c8103`):** Kevin set `MAPLESTORY_URL` (plain config, Production + Preview), and the preview built with no errors. On `kevincho-portal-git-maplestory-zone-kevin-cho.vercel.app`, after Kevin signed in to Vercel in the browser pane:
  - **What works:**
    - The home page lists the app, and the card opens `/maplestory`, served by the zone. All its files load from the portal's origin.
    - Clicking a tool card does a soft navigation to `/maplestory/damage`.
  - **What doesn't:** every segment prefetch returns **404**. These are the zone's `<Link>` prefetches carrying `Next-Router-Segment-Prefetch`, which `partialPrefetching` turns on. Each app page logs several console 404s, and navigation isn't prefetched.
  - **Cause, confirmed with requests:** the segment mapping runs twice.
    1. The portal's Vercel routing maps the header to `/maplestory/damage.segments/_tree.segment.rsc`.
    2. It forwards that path to the zone with the header still set, so the zone maps it again and returns 404.
  - **The evidence:**
    - Sent directly to the zone, the same request returns 200 (`x-matched-path: /damage.segments/_tree.segment.rsc`).
    - The zone serves the already-mapped path with 200 without the header, and 404 with it.
    - Plain RSC requests (`RSC: 1`, with or without `Next-Router-Prefetch`) return 200 through the portal.
    - Local `next dev` doesn't do this mapping, which is why the local check passed.
  - **Options:** Kevin chose to try `beforeFiles` rewrites first, keeping both apps' config identical. The alternatives were `partialPrefetching: false` in the zone (a verified stopgap that goes away in the next major) or shipping with the 404s.
- **Fix (commit `a5f2d8a`):** moved the rewrites to `beforeFiles`, so requests are forwarded before the portal's routing maps them. Lint, `tsc` and e2e (14) pass, and the local proxy still works.
- **Preview recheck (2026-11-04):**
  - The segment prefetch through the portal now returns **200**, with `x-matched-path: /damage.segments/_tree.segment.rsc`, mapped once, by the zone.
  - Every `_rsc` prefetch on `/maplestory` returns 200, and no resources fail.
  - The back arrow returns to the portal home with no failed requests.
  - The portal's `/mario-item-block` still returns 200.
- **Remaining:**
  - Open a PR and let CI run.
  - Merge into `master`.
  - Check `https://kevincho.ca/maplestory` in production.

---

## Change log
- **2026-11-04**: Plan created on branch `maplestory-zone`, from the maplestory-app plan's Step 6.
- **2026-11-04**: Step 1 built: rewrites, the app entry and the README. Verified locally through the portal dev server, and lint and e2e pass. Waiting on the Vercel env var.
- **2026-11-04**: Committed and pushed `29c8103`. The preview works, but the zone's segment prefetches return 404 through the portal (double segment mapping; see Step 1). Choosing a fix with Kevin.
- **2026-11-04**: Kevin chose to try `beforeFiles`. Committed and pushed `a5f2d8a`. On the preview, the prefetches now return 200 and nothing fails. Next: PR, merge, production check.
