# Plan 03: Bring back the mario-item-block easter egg

**Status:** 🟡 All steps built (Step 5 not yet committed); not pushed — Vercel build of the submodule still to check · **Branch:** `mario-item-block` (from `master`) · **Started:** 2026-11-02

## Context
The old jQuery site had a Konami-code easter egg: typing ↑↑↓↓←→←→BA on the home page sent you to `mario-item-block/index.html`, a tiny jQuery game from the [`mario-item-block`](https://github.com/kevin-cho/mario-item-block) repo (click to make Mario jump, hit the item block, and get a random item). The page also showed a row of arrow/B/A glyphs as a hint.

The Next.js rewrite (commit `1690696`) removed `js/konami.js` and the hint, but kept the `mario-item-block` git submodule at the repo root, where nothing serves it. It isn't checked out locally either (`git submodule status` shows `-7b45c9d`).

**Goal:** the game is reachable again at `kevincho.ca/mario-item-block`, through the Konami code plus a subtle hint on the home page.

### What the submodule contains (pinned at `7b45c9d`)
| Path | What it is |
|---|---|
| `index.html` | Loads jQuery 1.11.3 from Google's CDN, `css/mario.css`, `js/mario.js`, and calls `$('#mario-item-block').marioItemBlock()` |
| `js/mario.js` | The jQuery plugin; mouse down = jump and show a random item, mouse up = stand |
| `css/mario.css` | 150×250 game area styles |
| `images/` | Sprites (Mario, item block, coin, star, mushrooms, fire flower, goomba, background) |

Every asset path is relative (`css/…`, `js/…`, `images/…`), so the page has to be loaded from inside its own folder.

### Decisions
| Decision | Choice | Why |
|---|---|---|
| How the game is served | **Move the submodule to `public/mario-item-block`** and serve its files unchanged | Smallest change; the game's own repo stays the source of truth; relative asset paths keep working. Vercel clones public HTTPS submodules. Considered: porting it to a React page (duplicates code, drops the separate repo) and a separate Vercel zone (a lot of setup for a static page). |
| Game URL | **`/mario-item-block`, via a Next.js page that embeds the game in an iframe** (Step 4) | Kevin wants the address bar to show `/mario-item-block`, not `/index.html`. A plain rewrite breaks the game's relative asset paths. The iframe keeps the game repo untouched and puts the site's header and theme toggle around it. Considered: a `<base>` tag in the game repo (needs a commit there and a submodule bump) and a trailing-slash URL (`skipTrailingSlashRedirect`, which affects the whole site). Decided 2026-11-02. |
| How visitors reach it | **Konami code + a subtle hint** on the home page | Restores the old easter egg; the hint makes it discoverable and (as a link) reachable on phones, which have no arrow keys. |

Each step is reviewed and approved on its own before it's built.

---

## Step 1: Serve the game at `/mario-item-block` ✅ Done (commit `982d710`)
- **Requirement:** `/mario-item-block` shows the working game locally and on Vercel.
- **Why:** Next.js only serves static files from `public/`, so the submodule has to live there. It must load at `/mario-item-block/index.html` so its relative asset paths resolve.
- **How:**
  1. `git submodule update --init` (checks out the pinned commit `7b45c9d`).
  2. `git mv mario-item-block public/mario-item-block` — moves the submodule and updates `.gitmodules` in one go.
  3. `next.config.ts`: add a `redirects()` entry `/mario-item-block` → `/mario-item-block/index.html` (`permanent: false`). A redirect rather than a rewrite, so the browser's URL ends in `/index.html` and relative paths resolve.
  4. `eslint.config.mjs`: add `public/mario-item-block/**` to `globalIgnores` so `npm run lint` skips the jQuery code.
  5. `README.md`: note running `git submodule update --init` after cloning, and list the game under Project layout.
- **Verify:** in the dev server, `/mario-item-block` redirects, images load with no 404s, clicking makes Mario jump and shows an item; `npm run lint` and `npm run build` pass. The Vercel build is checked after a push.
- **Result (2026-11-02):** Submodule checked out at `7b45c9d` and moved to `public/mario-item-block` (`.gitmodules` path updated). In the dev server, `/mario-item-block` returns 307 → `/mario-item-block/index.html`; jQuery loads; the HTML, CSS, JS and every image return 200. Mouse down shows Mario jumping with an item (a coin) above the block; mouse up returns him to standing. `npm run lint` is clean and `next build` succeeds. Still to check: the Vercel build clones the submodule (after the next push).

## Step 2: Konami code on the home page ✅ Done (commit `c5e1522`)
- **Requirement:** typing ↑↑↓↓←→←→BA on the home page goes to the game.
- **Why:** restores the old `js/konami.js` behaviour without jQuery.
- **How:** new client component `src/components/konami-code.tsx` that renders nothing. A `useEffect` adds a `keydown` listener (removed on unmount) comparing `e.key` (lower-cased, so `B`/`b` both count) against `ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a`. A wrong key resets progress (to 1 if the wrong key is itself `ArrowUp`). On completion, `window.location.assign("/mario-item-block")` — a full page load, since the game is a static file, not a Next.js route. Mounted in `src/app/page.tsx`.
- **Verify:** in the browser preview, the key sequence navigates to the game; a wrong key mid-sequence doesn't; lint and type checks pass.
- **Result (2026-11-02):** In the browser preview, ↑↑↓↓←→ x ←→BA (wrong key in the middle) stayed on the home page; ↑↑↓↓←→←→ba opened `/mario-item-block/index.html`, and so did the same with capital B A. No console errors; `tsc --noEmit` passes. Lint flagged `window.location.assign` (rule `no-location-assign-relative-destination`, which assumes the target is a Next.js page). Since the game is a static file that needs a full page load, that one line has an `eslint-disable-next-line` with a comment; lint is now clean.

## Step 3: Subtle hint on the home page ✅ Done (commit `5ccf17d`)
- **Requirement:** a small, muted row of ↑↑↓↓←→←→ B A on the home page, like the old site.
- **Why:** makes the easter egg discoverable; on phones it's the only way in.
- **How:** new component `src/components/konami-hint.tsx` using `react-icons` arrows (already a dependency) plus "B" "A" text, styled with the semantic tokens (`text-muted-foreground`, hover `text-foreground`). Recommended: the whole row is a link to `/mario-item-block` with `aria-label="Mario item block game"` and `aria-hidden` glyphs, so it's tappable and accessible. (To confirm at this step: link vs purely decorative.)
- **Verify:** screenshots in light and dark mode and at mobile width; the hint opens the game; lint passes. Dev server left running for preview.
- **Result (2026-11-02):** Built as a link (the recommended option; Kevin approved the step without choosing, so it can still change to decorative). `src/components/konami-hint.tsx` is a server component placed under the links/app list in `src/app/page.tsx`: small `text-muted-foreground` arrows plus "B A", `hover:text-foreground`, a focus outline, and a `title` showing the sequence. Checked in the browser: subtle and readable in light and dark mode; at 375px wide it fits (175×24px, no horizontal scroll); its accessible name is "Mario item block game"; clicking it opens `/mario-item-block/index.html`. Lint and `tsc --noEmit` pass.

## Step 4: Keep the URL as `/mario-item-block` ✅ Done (commit `2b0ae26`)
- **Requirement:** opening the game (Konami code, hint, or typing the address) shows `/mario-item-block` in the address bar, not `/mario-item-block/index.html`.
- **Why:** Step 1's redirect changes the visible URL. A rewrite alone can't fix that, because the game's relative paths (`css/…`, `images/…`) would resolve at the site root and break (and `/images/` would collide with the site's own folder).
- **How:**
  1. `next.config.ts`: remove the `/mario-item-block` redirect.
  2. New page `src/app/mario-item-block/page.tsx`: centered `<iframe src="/mario-item-block/index.html" title="Mario item block game">`, sized to the game (150×250 plus the game page's default 8px body margin), no border, and a short muted caption ("Click to jump"). Page title "Mario Item Block · Kevin Cho" via `metadata`. The root layout's header (theme toggle) appears automatically. The static files keep working at `/mario-item-block/…`, since `public/mario-item-block` is a folder and doesn't clash with the page's route; to confirm in the build.
  3. `src/components/konami-code.tsx`: the game is now a Next.js route, so use `useRouter().push("/mario-item-block")` and remove the `eslint-disable` line.
  4. `src/components/konami-hint.tsx`: use `next/link` `<Link>` instead of `<a>` for client-side navigation.
  5. `README.md`: update the Project layout line to mention the page.
- **Verify:** `/mario-item-block` shows the game with the URL unchanged; the game plays inside the iframe; the Konami code and the hint both land on `/mario-item-block`; light/dark and mobile width look right; lint, `tsc --noEmit` and `next build` pass (build lists `/mario-item-block`).
- **Result (2026-11-02):** Built as planned. One addition: in dark mode the iframe first showed a white frame (the game page's 8px body margin). Browsers paint an embedded page's background opaque when its color scheme differs from the parent's, so the iframe now has `color-scheme: light` (`scheme-light`) to match the game page and stay transparent. Checked in the browser: the address bar stays `/mario-item-block` (title "Mario Item Block · Kevin Cho"); the game plays inside the iframe (jump shows an item, release stands); the Konami code and the hint both land on `/mario-item-block`; light and dark mode look right; at 375px wide it fits with no horizontal scroll. Lint (no override needed now), `tsc --noEmit` and `next build` pass; the build lists `/mario-item-block` as static. The production server (`next start`) returns 200 for the page and for `/mario-item-block/index.html`, its JS and images, and the site's own `/images/kevin.png`, so the page and the static folder coexist.
- **Notes:** with Next 16's `cacheComponents`, the game page stays in the DOM (hidden, `display: none`) after navigating back home, for fast back/forward. The old `/mario-item-block/index.html` URL still works if typed directly. On phones, a tap fires the game's mouse down and up almost together, so Mario's jump is very brief; that's the game's own behaviour (it only handles mouse events).

## Step 5: Back arrow on the game page ✅ Done
- **Requirement:** a back arrow at the top left of `/mario-item-block` that goes to the home page.
- **Why:** the game page has no way back except the browser's back button (and none at all if you arrived by typing the address).
- **How:** in `src/app/mario-item-block/page.tsx`, a `next/link` `<Link href="/">` with a `FaArrowLeft` icon (react-icons, as elsewhere), `aria-label` and `title` "Back to home". It's placed `absolute` at the top left, lined up with the theme toggle in the root layout's header (same `p-4` offset, `size-9`, round, `text-muted-foreground`, `hover:bg-muted hover:text-foreground`, focus outline), so the two look like a pair. Links to `/` rather than going back in history, so it works even when the page was opened directly. The root layout's header stays as it is, since only this page needs the arrow.
- **Verify:** the arrow lines up with the theme toggle; clicking it lands on `/`; screen readers name it "Back to home"; light/dark and mobile width look right; lint and `tsc --noEmit` pass.
- **Result (2026-11-02):** Built as planned. Checked in the browser: the arrow and the theme toggle are both 36×36 and 16px from the top, mirrored left and right; light and dark mode look right; at 375px wide there's no horizontal scroll; its accessible name is "Back to home"; clicking it lands on `/`. Lint and `tsc --noEmit` pass.

---

## Change log
- **2026-11-02** — Plan created after reviewing the submodule (read from GitHub, since it isn't checked out) and the old site's `konami.js` and hint. Decided: serve the submodule statically from `public/`; Konami code + hint.
- **2026-11-02** — Step 1 done: game served from `public/mario-item-block` with a redirect from `/mario-item-block`; verified locally.
- **2026-11-02** — Work moved to a new branch, `mario-item-block`, created from `master`.
- **2026-11-02** — Step 2 done: `KonamiCode` component on the home page; verified in the browser.
- **2026-11-02** — Step 3 done: `KonamiHint` link on the home page; verified in light/dark and at mobile width. Remaining: push and check that Vercel's build includes the submodule.
- **2026-11-02** — Step 4 added: Kevin wants the game's URL to stay `/mario-item-block` (Step 1's redirect showed `/index.html`). Chose a Next.js page with an iframe.
- **2026-11-02** — Step 4 done: game page at `/mario-item-block` with an iframe; redirect removed; Konami code uses the router and the hint uses `<Link>`. Verified in dev and with `next start`.
- **2026-11-02** — Step 5 added: back arrow on the game page, at Kevin's request.
- **2026-11-02** — Step 5 done: back arrow on the game page; verified in the browser.
