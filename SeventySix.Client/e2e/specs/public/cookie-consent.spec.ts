import { test, expect, ROUTES, COOKIE_NAMES, expectAccessible } from "@e2e-fixtures";

/**
 * E2E Tests: Cookie Consent Banner
 *
 * Tests GDPR/CCPA cookie consent banner behaviour.
 * All tests run in a fresh browser context with NO pre-set cookies
 * so the banner reliably appears on first visit.
 */
test.describe("Cookie Consent Banner",
() =>
{
// Fresh context with no storage state — ensures no consent cookie pre-set
test.use(
{
storageState: undefined
});

test("banner is visible on first visit with no consent cookie",
async ({ page }) =>
{
await page.goto(ROUTES.home);

const banner =
page.getByRole("region",
{ name: "Cookie consent" });
await expect(banner)
.toBeVisible();
});

test("Accept All Cookies hides the banner and sets consent cookie",
async ({ page }) =>
{
await page.goto(ROUTES.home);

const banner =
page.getByRole("region",
{ name: "Cookie consent" });
await expect(banner)
.toBeVisible();

await page.getByRole("button",
{ name: "Accept All Cookies" }).click();

await expect(banner)
.toBeHidden();

const cookies: Array<{ name: string }> =
await page.context().cookies();
const consentCookie =
cookies.find((cookie) => cookie.name === COOKIE_NAMES.cookieConsent);
expect(consentCookie)
.toBeDefined();
});

test("Reject Non-Essential hides the banner and sets consent cookie",
async ({ page }) =>
{
await page.goto(ROUTES.home);

const banner =
page.getByRole("region",
{ name: "Cookie consent" });
await expect(banner)
.toBeVisible();

await page.getByRole("button",
{ name: "Reject Non-Essential" }).click();

await expect(banner)
.toBeHidden();

const cookies: Array<{ name: string; value: string }> =
await page.context().cookies();
const consentCookie =
cookies.find((cookie) => cookie.name === COOKIE_NAMES.cookieConsent);
expect(consentCookie)
.toBeDefined();
});

test("Cookie Settings button opens the preferences dialog",
async ({ page }) =>
{
await page.goto(ROUTES.home);

await page.getByRole("button",
{ name: "Cookie Settings" }).click();

const dialog =
page.getByRole("dialog",
{ name: "Cookie Preferences" });
await expect(dialog)
.toBeVisible();
});

test("preferences dialog: Save My Choices closes dialog and sets cookie",
async ({ page }) =>
{
await page.goto(ROUTES.home);

await page.getByRole("button",
{ name: "Cookie Settings" }).click();

const dialog =
page.getByRole("dialog",
{ name: "Cookie Preferences" });
await expect(dialog)
.toBeVisible();

await page.getByRole("button",
{ name: "Save My Choices" }).click();

await expect(dialog)
.toBeHidden();

const cookies: Array<{ name: string }> =
await page.context().cookies();
const consentCookie =
cookies.find((cookie) => cookie.name === COOKIE_NAMES.cookieConsent);
expect(consentCookie)
.toBeDefined();
});

test("banner does not reappear after accepting on page reload",
async ({ page }) =>
{
await page.goto(ROUTES.home);

await page.getByRole("button",
{ name: "Accept All Cookies" }).click();

const banner =
page.getByRole("region",
{ name: "Cookie consent" });
await expect(banner)
.toBeHidden();

await page.reload();

await expect(banner)
.toBeHidden();
});

test("banner has no critical accessibility violations",
async ({ page }) =>
{
await page.goto(ROUTES.home);

const banner =
page.getByRole("region",
{ name: "Cookie consent" });
await expect(banner)
.toBeVisible();

await expectAccessible(page, "Cookie Consent Banner");
});
});
