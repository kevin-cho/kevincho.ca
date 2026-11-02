# Plan 03: Bring back the mario-item-block easter egg

**Status:** 🟡 In progress — Step 1 done (not yet committed); Step 2 awaiting approval · **Branch:** `mario-item-block` (from `master`) · **Started:** 2026-11-02

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
| How visitors reach it | **Konami code + a subtle hint** on the home page | Restores the old easter egg; the hint makes it discoverable and (as a link) reachable on phones, which have no arrow keys. |

Each step is reviewed and approved on its own before it's built.

---

## Step 1: Serve the game at `/mario-item-block` ✅ Done
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

## Step 2: Konami code on the home page ⬜ Not started
- **Requirement:** typing ↑↑↓↓←→←→BA on the home page goes to the game.
- **Why:** restores the old `js/konami.js` behaviour without jQuery.
- **How:** new client component `src/components/konami-code.tsx` that renders nothing. A `useEffect` adds a `keydown` listener (removed on unmount) comparing `e.key` (lower-cased, so `B`/`b` both count) against `ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a`. A wrong key resets progress (to 1 if the wrong key is itself `ArrowUp`). On completion, `window.location.assign("/mario-item-block")` — a full page load, since the game is a static file, not a Next.js route. Mounted in `src/app/page.tsx`.
- **Verify:** in the browser preview, the key sequence navigates to the game; a wrong key mid-sequence doesn't; lint and type checks pass.

## Step 3: Subtle hint on the home page ⬜ Not started
- **Requirement:** a small, muted row of ↑↑↓↓←→←→ B A on the home page, like the old site.
- **Why:** makes the easter egg discoverable; on phones it's the only way in.
- **How:** new component `src/components/konami-hint.tsx` using `react-icons` arrows (already a dependency) plus "B" "A" text, styled with the semantic tokens (`text-muted-foreground`, hover `text-foreground`). Recommended: the whole row is a link to `/mario-item-block` with `aria-label="Mario item block game"` and `aria-hidden` glyphs, so it's tappable and accessible. (To confirm at this step: link vs purely decorative.)
- **Verify:** screenshots in light and dark mode and at mobile width; the hint opens the game; lint passes. Dev server left running for preview.

---

## Change log
- **2026-11-02** — Plan created after reviewing the submodule (read from GitHub, since it isn't checked out) and the old site's `konami.js` and hint. Decided: serve the submodule statically from `public/`; Konami code + hint.
- **2026-11-02** — Step 1 done: game served from `public/mario-item-block` with a redirect from `/mario-item-block`; verified locally.
- **2026-11-02** — Work moved to a new branch, `mario-item-block`, created from `master`.
