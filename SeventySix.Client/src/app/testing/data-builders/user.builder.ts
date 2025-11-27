/**
 * User Test Data Builder
 * Simplifies creation of User objects for testing
 * Follows Builder pattern for test data creation
 */

import { User } from "@features/admin/users/models/user.model";

/**
 * Fluent builder for User test data
 * Provides sensible defaults while allowing customization
 *
 * @example
 * const user = new UserBuilder()
 *   .withUsername('testuser')
 *   .withEmail('test@example.com')
 *   .active()
 *   .build();
 */
export class UserBuilder
{
	private user: Partial<User> = {
		id: 1,
		username: "testuser",
		email: "test@example.com",
		fullName: "Test User",
		isActive: true,
		createDate: "2024-01-01T00:00:00Z",
		modifyDate: undefined,
		createdBy: "system",
		modifiedBy: undefined,
		lastLoginAt: undefined
	};

	/**
	 * Set the user ID
	 */
	withId(id: number): this
	{
		this.user.id = id;
		return this;
	}

	/**
	 * Set the username
	 */
	withUsername(username: string): this
	{
		this.user.username = username;
		return this;
	}

	/**
	 * Set the email
	 */
	withEmail(email: string): this
	{
		this.user.email = email;
		return this;
	}

	/**
	 * Set the full name
	 */
	withFullName(fullName: string): this
	{
		this.user.fullName = fullName;
		return this;
	}

	/**
	 * Mark user as active
	 */
	active(): this
	{
		this.user.isActive = true;
		return this;
	}

	/**
	 * Mark user as inactive
	 */
	inactive(): this
	{
		this.user.isActive = false;
		return this;
	}

	/**
	 * Set the created date (ISO string)
	 */
	createDate(date: string): this
	{
		this.user.createDate = date;
		return this;
	}

	/**
	 * Set the modified date (ISO string)
	 */
	modifyDate(date: string | undefined): this
	{
		this.user.modifyDate = date;
		return this;
	}

	/**
	 * Set the created by user
	 */
	createdBy(createdBy: string): this
	{
		this.user.createdBy = createdBy;
		return this;
	}

	/**
	 * Set the modified by user
	 */
	modifiedBy(modifiedBy: string | undefined): this
	{
		this.user.modifiedBy = modifiedBy;
		return this;
	}

	/**
	 * Set the last login date (ISO string)
	 */
	lastLoginAt(date: string | undefined): this
	{
		this.user.lastLoginAt = date;
		return this;
	}

	/**
	 * Build the User object
	 */
	build(): User
	{
		return this.user as User;
	}
}

/**
 * Create a default active user
 */
export function createActiveUser(overrides?: Partial<User>): User
{
	const builder: UserBuilder = new UserBuilder().active();
	if (overrides)
	{
		Object.assign(builder["user"], overrides);
	}
	return builder.build();
}

/**
 * Create a default inactive user
 */
export function createInactiveUser(overrides?: Partial<User>): User
{
	const builder: UserBuilder = new UserBuilder().inactive();
	if (overrides)
	{
		Object.assign(builder["user"], overrides);
	}
	return builder.build();
}

/**
 * Create an array of test users
 */
export function createUserArray(count: number): User[]
{
	const users: User[] = [];
	for (let i: number = 1; i <= count; i++)
	{
		users.push(
			new UserBuilder()
				.withId(i)
				.withUsername(`user${i}`)
				.withEmail(`user${i}@example.com`)
				.withFullName(`User ${i}`)
				.build()
		);
	}
	return users;
}
