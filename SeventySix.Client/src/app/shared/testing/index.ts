/**
 * Shared testing utilities and mocks barrel export
 * Domain-specific fixtures are in @admin/testing, @game/testing, etc.
 */

export * from "./assertion-helpers";
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
export {
	createMockThemeService,
	MockThemeService
} from "./mocks/theme.service.mock";
export * from "./mocks/user-profile.mock";
export * from "./mutation-helpers";
export * from "./provider-helpers";
export * from "./tanstack-query-helpers";
export * from "./test-bed-builders";
export * from "./test-factories";
export * from "./test-spy.utilities";
