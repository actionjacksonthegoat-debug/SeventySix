/**
 * Auth Payload Builders
 * Builds login and registration payloads for auth scenarios.
 */

/**
 * Builds a login payload.
 *
 * @param {string} usernameOrEmail
 * The username or email to authenticate with.
 *
 * @param {string} password
 * The password.
 *
 * @returns {object}
 * A login request payload object.
 */
export function buildLoginPayload(
	usernameOrEmail,
	password)
{
	return {
		usernameOrEmail: usernameOrEmail,
		password: password
	};
}

/**
 * Builds a registration initiation payload.
 *
 * @param {string} email
 * The email address to register.
 *
 * @param {object} [overrides]
 * Optional field overrides.
 *
 * @returns {object}
 * A registration initiation payload object.
 */
export function buildRegistrationPayload(
	email,
	overrides)
{
	return {
		email: email,
		...overrides
	};
}
