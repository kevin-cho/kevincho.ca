import { expect, test } from "./fixtures";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Kevin Cho");
});
