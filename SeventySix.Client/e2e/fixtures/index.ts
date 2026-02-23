// <copyright file="index.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Barrel export for all E2E fixtures.
 * Import from this file for consistent access to test utilities.
 */

// Core Playwright fixtures
export { expect, test } from "./auth.fixture";

// Fresh login fixtures for destructive auth tests (logout, etc.)
export { freshLoginTest } from "./fresh-login.fixture";

// Unauthenticated fixtures for testing anonymous access
export { unauthenticatedTest } from "./unauthenticated.fixture";

// Email testing
export { EmailTestHelper } from "./email.fixture";
export type { MailDevEmail } from "./email.fixture";

// TOTP helper
export {
	disableTotpViaApi,
	generateSafeTotpCode,
	generateSafeTotpCodeFromSecret,
	generateTotpCode,
	generateTotpCodeFromSecret,
	waitForFreshTotpWindow
} from "./helpers/totp.helper";

// Login helper
export { loginAsUser } from "./helpers/login.helper";

// Context login helper (fresh browser context + login)
export { loginInFreshContext } from "./helpers/context-login.helper";
export type { ContextLoginResult } from "./helpers/context-login.helper";

// Data table helper
export { waitForTableLoaded, waitForTableReady } from "./helpers/data-table.helper";

// Altcha helper
export { solveAltchaChallenge } from "./helpers/altcha.helper";

// Accessibility helper
export { expectAccessible } from "./helpers/accessibility.helper";

// Scroll helper (shared across home.spec.ts and landing-page.spec.ts)
export { scrollUntilVisible, triggerAllDeferBlocks } from "./helpers/scroll.helper";

// User-create stepper helper (shared across user-create.spec.ts tests)
export { fillUserCreateStepper } from "./helpers/user-create.helper";
export type { CreateUserOptions } from "./helpers/user-create.helper";

// Test users
export {
	BACKUP_CODES_USER,
	CONCURRENT_USER,
	CROSSTAB_USER,
	FORCE_PASSWORD_CHANGE_LIFECYCLE_USER,
	FORCE_PASSWORD_CHANGE_USER,
	FORGOT_PASSWORD_USER,
	getTestUserByRole,
	LOCKOUT_USER,
	MFA_BACKUP_CODES,
	PASSWORD_CHANGE_USER,
	PERM_APPROVE_USER,
	PROFILE_EDIT_USER,
	TEST_USERS,
	TOTP_ENROLL_USER,
	TOTP_VIEWER_USER
} from "./test-users.constant";
export type { TestUser } from "./test-users.constant";

// Constants
export { API_ROUTES, COOKIE_NAMES, E2E_CONFIG } from "./config.constant";
export { PAGE_TEXT } from "./page-text.constant";
export { createRouteRegex, ROUTE_GROUPS, ROUTES } from "./routes.constant";
export { SELECTORS } from "./selectors.constant";
export { TIMEOUTS } from "./timeouts.constant";

// Assertion helpers
export {
	expectNoAccessDenied,
	expectNoApplicationErrors
} from "./assertions.helper";

// Page helpers
export {
	AdminDashboardPageHelper,
	AuthPageHelper,
	ChangePasswordPageHelper,
	HomePageHelper
} from "./pages";