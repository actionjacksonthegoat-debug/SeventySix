import { computed, Signal, signal, WritableSignal } from "@angular/core";
import { UserProfileDto } from "@shared/models";
import { type Mock, vi } from "vitest";

/**
 * Mock AuthService for testing.
 * Provides a comprehensive mock with all AuthService methods needed for UI testing.
 *
 * Usage in tests:
 * ```typescript
 * const mockAuthService = createMockAuthService();
 * mockAuthService.setUser({ id: 1, username: "test", email: "test@test.com", roles: ["Admin"], fullName: "Test User" });
 * expect(mockAuthService.hasRole("Admin")).toBe(true);
 * expect(mockAuthService.hasAnyRole("Admin", "Developer")).toBe(true);
 * ```
 */
export class MockAuthService
{
	private readonly userSignal: WritableSignal<UserProfileDto | null> =
		signal<UserProfileDto | null>(null);

	/** Read-only user state. */
	readonly user: Signal<UserProfileDto | null> =
		this.userSignal.asReadonly();

	/** Computed authentication state. */
	readonly isAuthenticated: Signal<boolean> =
		computed(
			() => this.userSignal() !== null);

	/** Spy-able logout method. */
	logout: Mock =
		vi.fn();

	/**
	 * Checks if the current user has a specific role.
	 * @param {string} role
	 * The role to check.
	 * @returns {boolean}
	 * True if the user has the role, false otherwise.
	 */
	hasRole(role: string): boolean
	{
		const user: UserProfileDto | null =
			this.userSignal();
		return user?.roles.includes(role) ?? false;
	}

	/**
	 * Checks if the current user has any of the specified roles.
	 * @param {string[]} roles
	 * The roles to check.
	 * @returns {boolean}
	 * True if the user has any of the roles, false otherwise.
	 */
	hasAnyRole(...roles: string[]): boolean
	{
		const user: UserProfileDto | null =
			this.userSignal();
		return roles.some(
			(role: string) =>
				user?.roles.includes(role) ?? false);
	}

	/**
	 * Sets the authenticated user for testing.
	 * @param {UserProfileDto | null} user
	 * The user to set, or null for unauthenticated state.
	 * @returns {void}
	 */
	setUser(user: UserProfileDto | null): void
	{
		this.userSignal.set(user);
	}
}

/**
 * Factory function to create a new MockAuthService instance.
 * Use this in your test's beforeEach.
 *
 * @returns {MockAuthService}
 * A fresh MockAuthService instance for tests.
 */
export function createMockAuthService(): MockAuthService
{
	return new MockAuthService();
}
