import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const konamiCode = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

async function pressKeys(page: Page, keys: string[]) {
  for (const key of keys) {
    await page.keyboard.press(key);
  }
}

test.describe("Konami code", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // The key listener is added once React hydrates the page
    await page.waitForLoadState("networkidle");
  });

  test("opens the game", async ({ page }) => {
    await pressKeys(page, konamiCode);
    await expect(page).toHaveURL("/mario-item-block");
  });

  test("a wrong key in the middle doesn't", async ({ page }) => {
    await pressKeys(page, [...konamiCode.slice(0, 6), "x", ...konamiCode.slice(6)]);
    // Give a navigation the chance to start before checking it didn't
    await page.waitForTimeout(500);
    await expect(page).toHaveURL("/");
  });
});

test.describe("game page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mario-item-block");
  });

  test("keeps its own URL and title", async ({ page }) => {
    await expect(page).toHaveURL("/mario-item-block");
    await expect(page).toHaveTitle("Mario Item Block · Kevin Cho");
  });

  test("the game plays inside the iframe", async ({ page }) => {
    const game = page.frameLocator('iframe[title="Mario item block game"]');
    const mario = game.locator("#gameSprite");
    const item = game.locator("#gameItem");

    await expect(mario).toHaveClass(/\bstand\b/);
    await expect(item).toHaveAttribute("src", "images/spacer.png");

    // Mouse down: Mario jumps and a random item pops out of the block
    await game.locator("#gameArea").hover();
    await page.mouse.down();
    await expect(mario).toHaveClass(/\bjump\b/);
    await expect(mario).toHaveAttribute("src", "images/mario-jump.png");
    await expect(item).toHaveClass(/\bfloat\b/);
    await expect(item).not.toHaveAttribute("src", "images/spacer.png");

    // Mouse up: Mario lands
    await page.mouse.up();
    await expect(mario).toHaveClass(/\bstand\b/);
    await expect(item).toHaveClass(/\bland\b/);
  });

  test("the back arrow goes home", async ({ page }) => {
    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page).toHaveURL("/");
  });
});

test("the game's static files are served", async ({ request }) => {
  // These come from the git submodule, so a missing checkout fails here
  for (const path of ["index.html", "css/mario.css", "js/mario.js", "images/mario-stand.jpg"]) {
    const response = await request.get(`/mario-item-block/${path}`);
    expect(response.status(), path).toBe(200);
  }
});
