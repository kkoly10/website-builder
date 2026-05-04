import { test, expect, Page } from "@playwright/test";

const EMAIL = "comlan11@gmail.com";

// ─── helpers ────────────────────────────────────────────────────────────────

async function fill(page: Page, selector: string, value: string) {
  await page.locator(selector).fill(value);
}

async function fillByPlaceholder(page: Page, placeholder: string, value: string) {
  await page.locator(`[placeholder="${placeholder}"]`).fill(value);
}

async function clickPill(page: Page, label: string) {
  await page.getByRole("button", { name: label }).first().click();
}

// Uses the primary CTA button in each form — avoids matching Next.js dev tools
async function clickNext(page: Page) {
  await page.locator("button.btnPrimary").first().click();
}

async function waitForUrl(page: Page, pattern: RegExp, timeout = 20_000) {
  await page.waitForURL(pattern, { timeout });
}

async function waitForText(page: Page, pattern: RegExp | string) {
  await expect(page.getByText(pattern)).toBeVisible({ timeout: 20_000 });
}

// ─── /start — discovery call booking ────────────────────────────────────────

test("Start page — discovery call booking", async ({ page }) => {
  await page.goto("/start");
  await expect(page.locator("h1")).toBeVisible();

  await fill(page, "#dc-name", "Alex Dupont");
  await fill(page, "#dc-email", EMAIL);
  await fill(page, "#dc-company", "Dupont Consulting");

  await clickPill(page, "Custom app");

  await fill(page, "#dc-avail", "Tuesday or Thursday mornings ET");

  await page.getByRole("button", { name: /request my discovery call/i }).click();

  await waitForText(page, /you're on the list/i);
});

// ─── /rescue-intake ─────────────────────────────────────────────────────────

test("Rescue intake — 4 steps end to end", async ({ page }) => {
  await page.goto("/rescue-intake");
  await expect(page.locator("h2").first()).toBeVisible();

  // Step 1 — Your Site
  await fillByPlaceholder(page, "https://yoursite.com", "https://oldsite-example.com");

  const nameInput = page.locator('[placeholder="Jane Smith"]').first();
  if (await nameInput.isVisible()) await nameInput.fill("Alex Dupont");

  const companyInput = page.locator('[placeholder="Acme Services"]').first();
  if (await companyInput.isVisible()) await companyInput.fill("Dupont Consulting");

  // Platform — WordPress
  const wordpress = page.getByRole("button", { name: /wordpress/i }).first();
  if (await wordpress.isVisible()) await wordpress.click();

  await clickNext(page);

  // Step 2 — The Problems
  const slow = page.getByText(/slow/i).first();
  if (await slow.isVisible()) await slow.click();

  const urgencyBtn = page.getByRole("button", { name: /1-2 weeks|asap|urgent/i }).first();
  if (await urgencyBtn.isVisible()) await urgencyBtn.click();

  await clickNext(page);

  // Step 3 — Access & History
  await clickNext(page);

  // Step 4 — Contact & Submit
  const emailInput = page.locator('[placeholder="you@company.com"]').first();
  await emailInput.fill(EMAIL);

  await page.locator("button.btnPrimary").last().click();

  await waitForUrl(page, /\/book/, 20_000);
});

// ─── /portal-intake ─────────────────────────────────────────────────────────

test("Portal intake — end to end", async ({ page }) => {
  await page.goto("/portal-intake");
  await expect(page.locator("h2").first()).toBeVisible();

  // Step 1 — Business & Users
  const nameInput = page.locator('[placeholder="Jane Smith"]').first();
  await nameInput.fill("Alex Dupont");

  const companyInput = page.locator('[placeholder="Acme Services"]').first();
  if (await companyInput.isVisible()) await companyInput.fill("Dupont Consulting");

  // Access type
  const clientsBtn = page.getByRole("button", { name: /clients|customers/i }).first();
  if (await clientsBtn.isVisible()) await clientsBtn.click();

  // Current process textarea
  const processArea = page.locator("textarea").first();
  if (await processArea.isVisible()) {
    await processArea.fill(
      "We currently manage client projects via email and spreadsheets. Looking to centralise everything."
    );
  }

  await clickNext(page);

  // Step 2 — Features & Integrations
  const docsCheck = page.getByText(/doc|document|status/i).first();
  if (await docsCheck.isVisible()) await docsCheck.click();

  const invoicingCheck = page.getByText(/invoic/i).first();
  if (await invoicingCheck.isVisible()) await invoicingCheck.click();

  // Timeline
  const timelineBtn = page.getByRole("button", { name: /3.6|3-6|flexible/i }).first();
  if (await timelineBtn.isVisible()) await timelineBtn.click();

  await clickNext(page);

  // Step 3 — Project Context (budget, deadline, decision-maker) — continue through
  await clickNext(page);

  // Step 4 — Contact & Submit
  const emailInput = page.locator('[placeholder="you@company.com"]').first();
  await emailInput.fill(EMAIL);

  await page.locator("button.btnPrimary").last().click();

  await waitForUrl(page, /\/book/, 20_000);
});

// ─── /custom-app-intake ─────────────────────────────────────────────────────

test("Custom app intake — end to end", async ({ page }) => {
  await page.goto("/custom-app-intake");
  await expect(page.locator("h2").first()).toBeVisible();

  // Step 1 — Project Description, Company, Contact
  const descArea = page.locator("textarea").first();
  if (await descArea.isVisible()) {
    await descArea.fill(
      "A job scheduling tool for our field operations team — 15 people who manage field technicians."
    );
  }

  const nameInput = page.locator('[placeholder="Jane Smith"]').first();
  if (await nameInput.isVisible()) await nameInput.fill("Alex Dupont");

  const companyInput = page.locator('[placeholder="Acme Services"]').first();
  if (await companyInput.isVisible()) await companyInput.fill("Dupont Consulting");

  await clickNext(page);

  // Step 2 — Context (current solution, integrations)
  const solutionArea = page.locator("textarea").first();
  if (await solutionArea.isVisible()) {
    await solutionArea.fill("Currently tracking everything in spreadsheets — no real system in place.");
  }

  await clickNext(page);

  // Step 3 — Scope & Timeline
  const ideaBtn = page.getByRole("button", { name: /idea|concept|early/i }).first();
  if (await ideaBtn.isVisible()) await ideaBtn.click();

  const timelineBtn = page.getByRole("button", { name: /3.6|3-6|flexible/i }).first();
  if (await timelineBtn.isVisible()) await timelineBtn.click();

  await clickNext(page);

  // Step 4 — Contact & Submit
  const emailInput = page.locator('[placeholder="you@company.com"]').first();
  await emailInput.fill(EMAIL);

  await page.locator("button.btnPrimary").last().click();

  await waitForUrl(page, /\/book/, 20_000);
});

// ─── /ecommerce/intake ──────────────────────────────────────────────────────

test("Ecommerce intake — end to end", async ({ page }) => {
  await page.goto("/ecommerce/intake");
  await expect(page.locator("h1, h2").first()).toBeVisible();

  // Step 0 — select entry path "Build my store"
  const buildBtn = page.getByRole("button", { name: /build my store/i }).first();
  if (await buildBtn.isVisible()) await buildBtn.click();
  // Selecting a path navigates to step 1 automatically

  // Step 1 — contact info
  const bizInput = page.locator('[placeholder="Acme Store"]').first();
  if (await bizInput.isVisible()) await bizInput.fill("Maison Dupont");

  const nameInput = page.locator('[placeholder="Jane Smith"]').first();
  if (await nameInput.isVisible()) await nameInput.fill("Alex Dupont");

  const emailInput = page.locator('[placeholder="you@business.com"]').first();
  if (await emailInput.isVisible()) await emailInput.fill(EMAIL);

  await clickNext(page);

  // Step 2 — platform/services
  const shopifyBtn = page.getByRole("button", { name: /shopify/i }).first();
  if (await shopifyBtn.isVisible()) await shopifyBtn.click();

  await clickNext(page);

  // Step 3 — budget/timeline
  const budgetBtn = page.getByRole("button", { name: /5.*10|5k|10k|mid/i }).first();
  if (await budgetBtn.isVisible()) await budgetBtn.click();

  const timelineBtn = page.getByRole("button", { name: /3.6|3-6|flexible/i }).first();
  if (await timelineBtn.isVisible()) await timelineBtn.click();

  await clickNext(page);

  // Step 4 — submit
  await page.locator("button.btnPrimary").last().click();

  await waitForUrl(page, /\/ecommerce\/book/, 20_000);
});

// ─── /ops-intake ─────────────────────────────────────────────────────────────

test("Ops intake — end to end", async ({ page }) => {
  await page.goto("/ops-intake");
  await expect(page.locator("h2").first()).toBeVisible();

  // Step 1 — The Basics
  const companyInput = page.locator('[placeholder="Acme Corp"]').first();
  if (await companyInput.isVisible()) await companyInput.fill("Dupont Consulting");

  const nameInput = page.locator('[placeholder="Jane Smith"]').first();
  if (await nameInput.isVisible()) await nameInput.fill("Alex Dupont");

  await clickNext(page);

  // Step 2 — Tools & Pain Points
  const spreadsheet = page.getByText(/spreadsheet|excel|google sheet/i).first();
  if (await spreadsheet.isVisible()) await spreadsheet.click();

  const manual = page.getByText(/manual|repetitive/i).first();
  if (await manual.isVisible()) await manual.click();

  await clickNext(page);

  // Step 3 — Workflows & Budget
  const workflowCheck = page.getByText(/invoic|report|scheduling/i).first();
  if (await workflowCheck.isVisible()) await workflowCheck.click();

  // Budget select
  const budgetSelect = page.locator("select").first();
  if (await budgetSelect.isVisible()) {
    const opts = await budgetSelect.locator("option").allTextContents();
    const pick = opts.find((o) => /3|5|mid/i.test(o));
    if (pick) await budgetSelect.selectOption({ label: pick });
  }

  await clickNext(page);

  // Step 4 — Contact & Submit
  const emailInput = page.locator('[placeholder="you@company.com"]').first();
  if (await emailInput.isVisible()) await emailInput.fill(EMAIL);

  await page.locator("button.btnPrimary").last().click();

  await waitForUrl(page, /\/ops-book|\/ops-thank-you/, 20_000);
});
