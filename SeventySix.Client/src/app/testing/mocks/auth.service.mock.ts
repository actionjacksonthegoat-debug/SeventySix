import { signal, WritableSignal, computed, Signal } from "@angular/core";
import { AuthUser } from "@infrastructure/models/auth.model";

/**
 * Mock AuthService for testing.
 * Provides a comprehensive mock with all AuthService methods needed for UI testing.
 *
 * Usage in tests:
 * ```typescript
 * const mockAuthService = createMockAuthService();
 * mockAuthService.setUser({ id: 1, username: "test", email: "test@test.com", roles: ["Admin"], fullName: "Test User" });
 * expect(mockAuthService.hasRole("Admin")).toBeTrue();
 * expect(mockAuthService.hasAnyRole("Admin", "Developer")).toBeTrue();
 * ```
 */
export class MockAuthService
{
	private readonly userSignal: WritableSignal<AuthUser | null> =
		signal<AuthUser | null>(null);

	/** Read-only user state. */
	readonly user: Signal<AuthUser | null> = this.userSignal.asReadonly();

	/** Computed authentication state. */
	readonly isAuthenticated: Signal<boolean> = computed(
		() => this.userSignal() !== null
	);

	/** Spy-able logout method. */
	logout: jasmine.Spy = jasmine.createSpy("logout");

	/**
	 * Checks if the current user has a specific role.
	 * @param role The role to check.
	 * @returns True if the user has the role, false otherwise.
	 */
	hasRole(role: string): boolean
	{
		const user: AuthUser | null = this.userSignal();
		return user?.roles.includes(role) ?? false;
	}

	/**
	 * Checks if the current user has any of the specified roles.
	 * @param roles The roles to check.
	 * @returns True if the user has any of the roles, false otherwise.
	 */
	hasAnyRole(...roles: string[]): boolean
	{
		const user: AuthUser | null = this.userSignal();
		return roles.some(
			(role: string) => user?.roles.includes(role) ?? false
		);
	}

	/**
	 * Sets the authenticated user for testing.
	 * @param user The user to set, or null for unauthenticated state.
	 */
	setUser(user: AuthUser | null): void
	{
		this.userSignal.set(user);
	}
}

/**
 * Factory function to create a new MockAuthService instance.
 * Use this in your test's beforeEach.
 */
export function createMockAuthService(): MockAuthService
{
	return new MockAuthService();
}
