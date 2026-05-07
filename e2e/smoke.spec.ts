import { test, expect } from "@playwright/test";

// Smoke test: every important public route loads without server error
// and renders a top-level heading. Auth-gated routes are accepted if they
// redirect to /login. Run with `npm run test:smoke`.

type SmokeRoute = {
  path: string;
  // Accept the resolved URL matching one of these regexes after redirects.
  allowed: RegExp[];
};

const ROUTES: SmokeRoute[] = [
  { path: "/", allowed: [/\/(en|fr|es)?\/?$/] },
  { path: "/websites", allowed: [/\/(en|fr|es)?\/?websites$/] },
  { path: "/ecommerce", allowed: [/\/(en|fr|es)?\/?ecommerce$/] },
  { path: "/systems", allowed: [/\/(en|fr|es)?\/?systems$/] },
  { path: "/custom-web-apps", allowed: [/\/custom-web-apps$/] },
  { path: "/client-portals", allowed: [/\/client-portals$/] },
  { path: "/website-rescue", allowed: [/\/website-rescue$/] },
  { path: "/care-plans", allowed: [/\/care-plans$/] },
  { path: "/build/intro", allowed: [/\/build\/intro$/] },
  { path: "/build", allowed: [/\/build$/] },
  { path: "/estimate", allowed: [/\/estimate(\?.*)?$/] },
  { path: "/login", allowed: [/\/login(\?.*)?$/] },
  { path: "/signup", allowed: [/\/signup(\?.*)?$/] },
  // Portal and admin require auth — accept the auth-page redirect.
  { path: "/portal", allowed: [/\/portal$/, /\/login(\?.*)?$/] },
  { path: "/internal/admin", allowed: [/\/internal\/admin$/, /\/login(\?.*)?$/, /\/auth\/login(\?.*)?$/] },
];

for (const route of ROUTES) {
  test(`smoke: ${route.path}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on("response", (res) => {
      if (res.url().includes(route.path) && res.status() >= 500) {
        consoleErrors.push(`HTTP ${res.status()} on ${res.url()}`);
      }
    });

    const resp = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    expect(resp, `no response for ${route.path}`).not.toBeNull();
    expect(resp!.status(), `5xx on ${route.path}`).toBeLessThan(500);

    const finalPath = new URL(page.url()).pathname + new URL(page.url()).search;
    expect(
      route.allowed.some((re) => re.test(finalPath)),
      `unexpected final URL for ${route.path}: ${finalPath}`,
    ).toBe(true);

    // Some auth pages may not have a top-level h1; require either an h1 or h2.
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });

    expect(consoleErrors, `runtime errors on ${route.path}`).toEqual([]);
  });
}
