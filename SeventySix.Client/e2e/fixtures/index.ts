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

// Test users
export { TEST_USERS, getTestUserByRole } from "./test-users.constant";
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
	expectNoApplicationErrors,
	captureConsoleErrors,
	expectNoConsoleErrors,
	expectNavigatedTo
} from "./assertions.helper";

// Page helpers
export {
	AuthPageHelper,
	HomePageHelper,
	AdminDashboardPageHelper,
	UserManagementPageHelper,
	ProfilePageHelper,
	RequestPermissionsPageHelper
} from "./pages";
