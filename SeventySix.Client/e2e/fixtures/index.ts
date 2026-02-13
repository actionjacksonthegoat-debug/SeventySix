// <copyright file="index.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Barrel export for all E2E fixtures.
 * Import from this file for consistent access to test utilities.
 */

// Core Playwright fixtures
export { test, expect } from "./auth.fixture";

// Fresh login fixtures for destructive auth tests (logout, etc.)
export { freshLoginTest } from "./fresh-login.fixture";

// Unauthenticated fixtures for testing anonymous access
export { unauthenticatedTest } from "./unauthenticated.fixture";

// Email testing
export { EmailTestHelper } from "./email.fixture";
export type { MailDevEmail } from "./email.fixture";

// TOTP helper
export { generateTotpCode, generateTotpCodeFromSecret } from "./helpers/totp.helper";

// Login helper
export { loginAsUser } from "./helpers/login.helper";

// Altcha helper
export { solveAltchaChallenge } from "./helpers/altcha.helper";

// Accessibility helper
export { expectAccessible } from "./helpers/accessibility.helper";

// Test users
export { TEST_USERS, getTestUserByRole, MFA_BACKUP_CODES, FORCE_PASSWORD_CHANGE_USER, FORCE_PASSWORD_CHANGE_LIFECYCLE_USER, PASSWORD_CHANGE_USER, TOTP_ENROLL_USER, FORGOT_PASSWORD_USER, LOCKOUT_USER, CONCURRENT_USER, CROSSTAB_USER } from "./test-users.constant";
export type { TestUser } from "./test-users.constant";

// Constants
export { SELECTORS } from "./selectors.constant";
export { ROUTES, ROUTE_GROUPS, createRouteRegex } from "./routes.constant";
export { PAGE_TEXT } from "./page-text.constant";
export { TIMEOUTS } from "./timeouts.constant";
export { E2E_CONFIG } from "./config.constant";

// Assertion helpers
export {
	expectNoAccessDenied,
	expectNoApplicationErrors
} from "./assertions.helper";

// Page helpers
export {
	AuthPageHelper,
	ChangePasswordPageHelper,
	HomePageHelper,
	AdminDashboardPageHelper,
} from "./pages";
