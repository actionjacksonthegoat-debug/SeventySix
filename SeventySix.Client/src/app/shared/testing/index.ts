/**
 * Shared testing utilities and mocks barrel export
 * Domain-specific fixtures are in @admin/testing, @game/testing, etc.
 */

export * from "./constants";
export * from "./data-builders";
// Domain-specific fixtures moved to @admin/testing, @game/testing
// export * from "./fixtures";
export * from "./integration-test.helper";
export * from "./mock-factories";
export {
	createMockAuthService,
	MockAuthService
} from "./mocks/auth.service.mock";
export * from "./mocks/user-profile.mock";
export * from "./tanstack-query-helpers";
export * from "./test-bed-builders";
