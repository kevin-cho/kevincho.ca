# Plan 04: End-to-end UI tests with Playwright

**Status:** 🚧 In progress (started 2026-11-04) · **Branch:** `e2e-tests` (from `master`)

## Context
To check each change so far, Claude has driven the browser pane: screenshots (about 1–2k tokens each), accessibility-tree reads and console checks, all repeated from scratch every time. That costs a lot of tokens and leaves nothing behind. Earlier features (Konami code, hint, `/mario-item-block` URL, back arrow, theme toggle) are never re-checked.

**Goal:** a Playwright suite that Claude (or you) runs with one command after every change. When it passes, the output is a line or two. Old behaviour is re-checked automatically, and the same tests run on every PR in GitHub Actions. The browser pane is kept for a single visual check of new UI work.

There are no tests or GitHub workflows in the repo yet. The only checks on PRs come from Vercel. Next's own guide (`node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`) recommends testing against a production build and using Playwright's `webServer` option.

### Decisions
| Decision | Choice | Why |
|---|---|---|
| Server under test | **Production build**: `next build && next start` on port **3100**, started by Playwright's `webServer` | Matches Vercel and is what Next recommends. A port of its own avoids clashing with `next dev` (3000) and the `next-start` preview (3001). The server isn't reused, so tests never run against a stale build. Costs about 20–40s of build time per run. |
| Browsers | **Chromium only** | One browser download, fastest runs; enough for a small personal site. WebKit can be added later. |
| Visual (screenshot) comparisons | **Not yet** | Baselines made on macOS don't match Linux CI, so they add upkeep. Behaviour tests come first. |
| CI | **GitHub Actions on PRs and pushes to `master`, as the last step** | A broken change shows up as a failing check next to Vercel's. |
| Test location / reporter | `e2e/` folder; `line` reporter locally, `github` + `line` in CI | Keeps them apart from future unit tests. Terse output keeps the tokens Claude reads small. |

Each step below is reviewed and approved on its own before it's built.

---

## Step 1: Install and configure Playwright ✅ Done (commit `9365bf0`)
- **Requirement:** `npm run test:e2e` builds the site, starts it, runs the tests in headless Chromium and prints a short pass/fail summary.
- **Why:** the foundation for everything else, with one command for both of us to run.
- **How:**
  1. Create branch `e2e-tests`; save this plan as `docs/plans/04-e2e-tests.md`.
  2. `npm i -D @playwright/test` and `npx playwright install chromium` (with nvm loaded). This is a manual install, not the interactive `npm init playwright`, so no example files are generated.
  3. `playwright.config.ts`:
     - `testDir: "e2e"` and `baseURL: "http://localhost:3100"`.
     - A single `chromium` project, `forbidOnly` in CI, 1 retry in CI only.
     - Reporter `line` locally and `[["github"], ["line"]]` in CI; `trace: "retain-on-failure"`.
     - `webServer`: `npm run build && npm run start -- -p 3100`, `url` set to the base URL, `reuseExistingServer: false`, and a timeout of about 120s.
  4. `package.json`: add the script `"test:e2e": "playwright test"`.
  5. `.gitignore`: add `/test-results/`, `/playwright-report/`, `/blob-report/` and `/playwright/.cache/`.
  6. `e2e/fixtures.ts`: a shared `test` that collects page errors and `console.error` messages and fails the test if any occur, so every test also checks "no console errors" for free.
  7. A first smoke test, `e2e/smoke.spec.ts`: the home page loads with the title "Kevin Cho".
  8. `README.md`: a short "Tests" section covering `npm run test:e2e` and `npx playwright test --ui` for debugging.
- **Verify:** `npm run test:e2e` passes. Also check that it doesn't disturb a running `next dev`: Next 16 keeps dev output separate from build output, to confirm at this step. Lint and `tsc --noEmit` pass on the new files.
- **Result (2026-11-04):** Built as planned with `@playwright/test` 1.64.1 and Chrome Headless Shell 156. `npm run test:e2e` passes the smoke test in about 14s, including the production build. The local output is three lines. With `next dev` running on 3000, a test run left it working (200, no server errors): dev output lives in `.next/dev`, separate from the build. A throwaway test that calls `console.error("boom")` failed with "page errors: boom", so the fixture works; that test was deleted. Lint and `tsc --noEmit` pass.

## Step 2: Home page tests (`e2e/home.spec.ts`) ✅ Done (commit `b591368`)
- **Requirement:** the home page's behaviour is covered.
- **Why:** the most-visited page, and the theme toggle has the trickiest logic (saved choice vs OS setting).
- **How:** tests for:
  - **Identity:** the `h1` "Kevin Cho", the subtitle, and the photo actually loads (`naturalWidth > 0`).
  - **Links:** GitHub, LinkedIn, Email and Resume are reachable by their accessible names with the right `href`. External sites are never visited. `/kevin-cho-resume.pdf` returns 200, checked through `request`.
  - **Apps section:** hidden while `src/data/apps.ts` is empty. The test reads `apps` so it still holds once apps are added.
  - **Theme:**
    - With an OS dark preference (`colorScheme: "dark"`), the page starts dark.
    - Clicking "Use dark mode" adds `dark` to `<html>`, and the choice survives a reload.
    - Clicking "Use light mode" switches back.
  - **Konami hint:** clicking the link named "Mario item block game" lands on `/mario-item-block`.
  - **Mobile:** at 375px wide there's no horizontal scroll.
- **Verify:** the suite passes. To prove the tests can fail, temporarily break one thing (e.g. a wrong `href`) and watch the test catch it, then revert.
- **Result (2026-11-04):** 8 tests, all passing in about 12s plus the build. Additions to the plan:
  - The page title check moved here from `e2e/smoke.spec.ts`, which was deleted as redundant.
  - The resume check also confirms the `application/pdf` content type.
  - An extra theme test checks that a saved light choice wins over a dark OS setting.

  The theme tests set the OS preference with `page.emulateMedia`. The apps test imports `apps` through the `@/` path alias, which Playwright reads from `tsconfig.json`. As a deliberate break, changing the GitHub link to `kevin-chox` failed "links point to the right places" with the expected and received URLs; the change was reverted. Lint and `tsc --noEmit` pass.

## Step 3: Konami code and game page tests (`e2e/mario-item-block.spec.ts`) ✅ Done (commit `bcbd7d9`)
- **Requirement:** the easter egg and the game page are covered.
- **Why:** these are Plan 03's features, and they're easy to break by accident (iframe paths, submodule, router).
- **How:** tests for:
  - **Konami code:** typing ↑↑↓↓←→←→BA on `/` lands on `/mario-item-block`. With a wrong key in the middle, it stays on `/`.
  - **Game page:**
    - The URL stays `/mario-item-block` and the title is "Mario Item Block · Kevin Cho".
    - The iframe "Mario item block game" is present, and inside it (`frameLocator`) `#mario-item-block` is rendered.
    - A mouse down inside the frame shows Mario jumping and an item. The exact selectors come from `public/mario-item-block/js/mario.js` at this step.
  - **Static files:** `/mario-item-block/index.html`, its CSS/JS and a sprite return 200. This catches a missing submodule checkout.
  - **Back arrow:** "Back to home" lands on `/`.
- **Note:** the game loads jQuery from Google's CDN, so these tests need network access (fine locally and in GitHub Actions).
- **Verify:** the full suite passes. A deliberate break (e.g. a wrong iframe `src`) is caught, then reverted.
- **Result (2026-11-04):** 6 tests, as planned.
  - The game test asserts on `#gameSprite` (class `stand`/`jump`, the jump image) and `#gameItem` (class `land`/`float`, no longer the blank `spacer.png`), the selectors from `js/mario.js`.
  - The Konami tests wait for `networkidle` first, because the key listener only exists once React hydrates. The wrong-key test waits 500ms before checking that the URL stayed `/`, since a navigation that never happens can't be awaited.

  The full suite (14 tests) passes in about 15s plus the build. The game tests passed 30 out of 30 runs with `--repeat-each=5`, so no flakiness. As a deliberate break, the iframe `src` was set to `indx.html`. The game test failed (elements not found), and the other game page tests failed through the fixture (the 404 shows up as a console error). The change was reverted. Lint and `tsc --noEmit` pass.

## Step 4: Make the tests the default way to verify ✅ Done (commit `fa818fa`)
- **Requirement:** future sessions verify changes with `npm run test:e2e` first. The browser pane is kept for one visual check of new or changed UI.
- **Why:** this is where the token savings come from. Without it, sessions fall back to screenshots.
- **How:** add a checked-in project `CLAUDE.md`. Claude Code loads it in every session, which is how project instructions are shared, and it can import `AGENTS.md` with `@AGENTS.md`. The new section, "Verifying changes", says:
  - run `npm run test:e2e` and only read the details when something fails;
  - add or update tests with each feature;
  - use the browser pane only for visual checks, preferring `read_page` over screenshots.

  Also update the auto-memory note on how verification works.
- **Verify:** the file reads clearly. A new session picks it up (it shows in the session's loaded instructions).
- **Result (2026-11-04):** Added `CLAUDE.md`: an `@AGENTS.md` import (so the Next.js note keeps loading now that a `CLAUDE.md` exists), then "Verifying changes" with the three rules above. Two additions: tests are written in the same step as the feature they cover, and there's at most one screenshot per view.
  - **Memory:** no auto-memory note covered verification, so none was changed. A new one would only repeat `CLAUDE.md`, which is checked in and loads every session. "Keep the dev server running" still holds.
  - **Not verified yet:** whether a new session picks up `CLAUDE.md`. This session loaded its instructions before the file existed; to check at the start of the next session.

## Step 5: GitHub Actions workflow (`.github/workflows/e2e.yml`) 🚧 Built, waiting for the first run on GitHub
- **Requirement:** lint and E2E tests run on every PR and on pushes to `master`.
- **Why:** catches breakage before merge, without relying on anyone remembering to run the tests.
- **How:**
  - Triggers: `pull_request` and `push` to `master`.
  - `actions/checkout` with `submodules: true`, so the game is there.
  - `actions/setup-node` with `node-version-file: .nvmrc` and the npm cache.
  - Then `npm ci`, `npx playwright install --with-deps chromium`, `npm run lint` and `npm run test:e2e`.
  - Upload `playwright-report/` and the traces as an artifact when a job fails.
- **Verify:** push the branch and open a PR (both only with your go-ahead). The new check passes next to Vercel's. Then decide whether to make it a required check in branch protection; that setting is yours to change.
- **Result so far (2026-11-04):** Built as planned, using `actions/checkout`, `actions/setup-node` and `actions/upload-artifact` at v7 (the latest releases). Changes and additions:
  - **Upload:** the failure upload is `test-results/` (the traces). With the `line` reporter, Playwright writes no `playwright-report/`.
  - **Permissions:** read-only `contents`.
  - **Concurrency:** a new push cancels the run still in progress.
  - **Timeout:** 15 minutes.

  Locally, the YAML parses to the expected steps, and `CI=1 npx playwright test` passes all 14 tests with the GitHub summary annotation. Still to do: push the branch and open a PR (with Kevin's go-ahead), and confirm the check passes on GitHub.

---

## Change log
- **2026-11-04** — Plan created. Decided: production build on port 3100, Chromium only, no screenshot baselines yet, GitHub Actions as the final step.
- **2026-11-04** — Branch `e2e-tests` created. Step 1 done: Playwright installed and configured with a smoke test and an error-catching fixture; verified.
- **2026-11-04** — Step 2 done: home page tests (identity, links, apps, theme, hint, mobile); a deliberate break was caught.
- **2026-11-04** — Step 3 done: Konami code, game page, static files and back arrow tests; checked for flakiness (30/30) and a deliberate break was caught.
- **2026-11-04** — Step 4 done: project `CLAUDE.md` makes `npm run test:e2e` the default check; the browser pane is kept for visual checks. To confirm in the next session that it loads.
- **2026-11-04** — Step 5 built: `.github/workflows/e2e.yml` runs lint and the e2e tests on PRs and pushes to `master`; checked locally in CI mode. Waiting to push and open a PR.
