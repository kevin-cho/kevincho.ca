@AGENTS.md

## Verifying changes

End-to-end tests (Playwright, in `e2e/`) are the default way to check a change; see the README's "Tests" section.

- Run `npm run test:e2e` (with nvm loaded) after each change. It builds the site and tests it on port 3100, so it doesn't touch the `next dev` preview. A passing run prints a line or two; read the details only when something fails.
- Add or update tests with each feature, in the same step. Import `test` and `expect` from `e2e/fixtures.ts`, which also fails a test on page errors or `console.error`.
- Use the browser pane only to check how new or changed UI looks. Prefer `read_page` over screenshots, and take at most one screenshot per view (e.g. light, dark, phone width).
