import { apps } from "@/data/apps";
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows Kevin's name, title and photo", async ({ page }) => {
  await expect(page).toHaveTitle("Kevin Cho");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kevin Cho");
  await expect(page.getByText("Senior Software Engineer")).toBeVisible();

  const photo = page.getByRole("img", { name: "Photo of Kevin Cho" });
  await expect(photo).toBeVisible();
  // naturalWidth is 0 if the image failed to load
  await expect
    .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});

test("links point to the right places", async ({ page, request }) => {
  const links = page.getByRole("navigation", { name: "Links" });
  await expect(links.getByRole("link", { name: "GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/kevin-cho",
  );
  await expect(links.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/chokevinj",
  );
  await expect(links.getByRole("link", { name: "Email" })).toHaveAttribute(
    "href",
    "mailto:chokevinj@gmail.com",
  );
  await expect(links.getByRole("link", { name: "Resume" })).toHaveAttribute(
    "href",
    "/kevin-cho-resume.pdf",
  );

  // External sites aren't visited; the resume is ours, so check it's served
  const resume = await request.get("/kevin-cho-resume.pdf");
  expect(resume.status()).toBe(200);
  expect(resume.headers()["content-type"]).toBe("application/pdf");
});

test("lists the apps, or hides the section while there are none", async ({ page }) => {
  const heading = page.getByRole("heading", { name: "Apps" });
  if (apps.length === 0) {
    await expect(heading).toHaveCount(0);
    return;
  }

  const section = page.getByRole("region", { name: "Apps" });
  await expect(heading).toBeVisible();
  for (const app of apps) {
    await expect(section.getByRole("link", { name: app.name })).toHaveAttribute("href", app.url);
  }
});

test("a lone or odd last app card is centered at half width", async ({ page }) => {
  test.skip(apps.length % 2 === 0, "only applies to an odd number of apps");

  const list = await page.getByRole("region", { name: "Apps" }).getByRole("list").boundingBox();
  const last = await page.getByRole("region", { name: "Apps" }).getByRole("listitem").last().boundingBox();
  if (!list || !last) throw new Error("app list not rendered");

  expect(Math.abs(last.x + last.width / 2 - (list.x + list.width / 2))).toBeLessThan(1);
  expect(last.width).toBeLessThan(list.width / 2);
});

test.describe("theme", () => {
  const html = (page: import("@playwright/test").Page) => page.locator("html");

  test("follows the OS setting when nothing is saved", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await expect(html(page)).toHaveClass(/\bdark\b/);

    await page.emulateMedia({ colorScheme: "light" });
    await expect(html(page)).not.toHaveClass(/\bdark\b/);
  });

  test("toggle switches modes and the choice survives a reload", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.reload();

    await page.getByRole("button", { name: "Use dark mode" }).click();
    await expect(html(page)).toHaveClass(/\bdark\b/);

    await page.reload();
    await expect(html(page)).toHaveClass(/\bdark\b/);

    await page.getByRole("button", { name: "Use light mode" }).click();
    await expect(html(page)).not.toHaveClass(/\bdark\b/);
  });

  test("a saved choice wins over the OS setting", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await page.getByRole("button", { name: "Use light mode" }).click();

    await page.reload();
    await expect(html(page)).not.toHaveClass(/\bdark\b/);
  });
});

test("the Konami hint opens the game", async ({ page }) => {
  await page.getByRole("link", { name: "Mario item block game" }).click();
  await expect(page).toHaveURL("/mario-item-block");
});

test.describe("on a phone-sized screen", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("has no horizontal scroll", async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
