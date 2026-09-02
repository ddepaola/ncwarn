import { test, expect } from "@playwright/test";

test("home renders and address form is present", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Know What’s Nearby");
  await expect(page.getByPlaceholder("Enter a North Carolina street address")).toBeVisible();
});

test("health endpoint reports ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe("ok");
});

test("check flow: Charlotte address resolves to Mecklenburg with a real crime card", async ({ page }) => {
  await page.goto("/check");
  await page.getByPlaceholder("Enter a North Carolina street address").fill("600 E 4th St, Charlotte, NC 28202");
  await page.getByRole("button", { name: "Check address" }).click();
  await expect(page).toHaveURL(/lookup=lk_/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("600 E 4TH ST");
  await expect(page.getByText("Mecklenburg County, North Carolina")).toBeVisible();
  const crime = page.locator("#crime");
  await expect(crime.getByRole("heading", { name: "Reported Crime Activity Near This Property" })).toBeVisible();
  await expect(crime.getByText(/reported incidents? within/)).toBeVisible();
  await expect(crime.getByText("safety score")).toBeVisible();
  // radius/period navigation keeps the lookup
  await crime.getByRole("link", { name: "3 mi" }).click();
  await expect(page).toHaveURL(/radius=3/);
  await expect(page.locator("#crime").getByText(/within 3 mi/)).toBeVisible();
});

test("check flow: outside NC is stated plainly", async ({ page }) => {
  await page.goto("/check");
  await page.getByPlaceholder("Enter a North Carolina street address").fill("1600 Pennsylvania Ave NW, Washington, DC 20500");
  await page.getByRole("button", { name: "Check address" }).click();
  await expect(page.getByRole("alert")).toContainText(/outside/i);
});

test("admin requires authentication", async ({ request }) => {
  for (const path of ["/admin/sources", "/api/admin/sources"]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(401);
  }
});

test("signup honeypot rejects a filled trap field", async ({ page, request }) => {
  await page.goto("/check");
  await page.getByPlaceholder("Enter a North Carolina street address").fill("600 E 4th St, Charlotte, NC 28202");
  await page.getByRole("button", { name: "Check address" }).click();
  await expect(page).toHaveURL(/lookup=lk_/);
  const token = await page.locator('form input[name="form_token"]').first().inputValue();
  const res = await request.post("/api/signup", { form: { form_token: token, website_url: "http://spam.example", email: "bot@example.com" } });
  expect(res.ok()).toBeFalsy();
  const body = await res.json();
  expect(body.ok).toBe(false);
});

test("public pages return 200 and carry the disclaimer", async ({ page }) => {
  for (const path of ["/sources", "/methodology", "/pricing", "/privacy", "/terms", "/disclaimers", "/contact", "/counties/mecklenburg"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.getByText("not law enforcement, legal advice, an official registry")).toBeVisible();
  }
});
