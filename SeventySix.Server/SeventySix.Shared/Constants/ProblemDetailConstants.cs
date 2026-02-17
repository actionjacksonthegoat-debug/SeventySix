// <copyright file="ProblemDetailConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for RFC 7807 ProblemDetails responses.
/// Single source of truth for error response types and titles (DRY).
/// </summary>
public static class ProblemDetailConstants
{
	/// <summary>
	/// RFC 7807 type URIs for error classification.
	/// </summary>
	public static class Types
	{
		/// <summary>
		/// Type URI for validation errors.
		/// </summary>
		public const string Validation = "https://tools.ietf.org/html/rfc7231#section-6.5.1";

		/// <summary>
		/// Type URI for authentication errors.
		/// </summary>
		public const string Authentication = "https://tools.ietf.org/html/rfc7235#section-3.1";

		/// <summary>
		/// Type URI for authorization errors.
		/// </summary>
		public const string Authorization = "https://tools.ietf.org/html/rfc7231#section-6.5.3";

		/// <summary>
		/// Type URI for not found errors.
		/// </summary>
		public const string NotFound = "https://tools.ietf.org/html/rfc7231#section-6.5.4";

		/// <summary>
		/// Type URI for conflict errors.
		/// </summary>
		public const string Conflict = "https://tools.ietf.org/html/rfc7231#section-6.5.8";

		/// <summary>
		/// Type URI for rate limit errors.
		/// </summary>
		public const string RateLimit = "https://tools.ietf.org/html/rfc6585#section-4";

		/// <summary>
		/// Type URI for internal server errors.
		/// </summary>
		public const string InternalError = "https://tools.ietf.org/html/rfc7231#section-6.6.1";
	}

	/// <summary>
	/// Standard titles for ProblemDetails responses.
	/// </summary>
	public static class Titles
	{
		/// <summary>
		/// Title for validation errors.
		/// </summary>
		public const string ValidationFailed = "One or more validation errors occurred.";

		/// <summary>
		/// Title for authentication errors.
		/// </summary>
		public const string AuthenticationFailed = "Authentication failed.";

		/// <summary>
		/// Title for authorization errors.
		/// </summary>
		public const string AccessDenied = "Access denied.";

		/// <summary>
		/// Title for not found errors.
		/// </summary>
		public const string NotFound = "Not Found";

		/// <summary>
		/// Title for conflict errors.
		/// </summary>
		public const string Conflict = "Resource conflict.";

		/// <summary>
		/// Title for rate limit errors.
		/// </summary>
		public const string TooManyRequests = "Too many requests.";

		/// <summary>
		/// Title for internal server errors.
		/// </summary>
		public const string InternalError = "An error occurred while processing your request.";

		/// <summary>
		/// Title for business rule violation errors.
		/// </summary>
		public const string BusinessRuleViolation = "Business Rule Violation";

		/// <summary>
		/// Title for domain logic errors.
		/// </summary>
		public const string DomainError = "Domain Error";

		/// <summary>
		/// Title for bad request errors.
		/// </summary>
		public const string BadRequest = "Bad Request";

		/// <summary>
		/// Title for invalid OAuth authorization code.
		/// </summary>
		public const string InvalidCode = "Invalid Code";

		/// <summary>
		/// Title for failed OAuth provider unlink.
		/// </summary>
		public const string UnlinkFailed = "Unlink Failed";

		/// <summary>
		/// Title for unconfigured OAuth provider.
		/// </summary>
		public const string ProviderNotFound = "Provider Not Found";

		/// <summary>
		/// Title for unauthorized access errors.
		/// </summary>
		public const string Unauthorized = "Unauthorized";

		/// <summary>
		/// Title for internal server errors (short form).
		/// </summary>
		public const string InternalServerError = "Internal Server Error";

		/// <summary>
		/// Title for validation errors.
		/// </summary>
		public const string ValidationError = "Validation Error";
	}

	/// <summary>
	/// Standard detail messages for ProblemDetails responses.
	/// </summary>
	public static class Details
	{
		/// <summary>
		/// Detail for invalid credentials.
		/// </summary>
		public const string InvalidCredentials = "Invalid username/email or password.";

		/// <summary>
		/// Detail for account locked.
		/// </summary>
		public const string AccountLocked = "Account is locked. Please try again later.";

		/// <summary>
		/// Detail for email not confirmed.
		/// </summary>
		public const string EmailNotConfirmed = "Email address has not been confirmed.";

		/// <summary>
		/// Detail for user not found.
		/// </summary>
		public const string UserNotFound = "User was not found.";

		/// <summary>
		/// Detail for insufficient permissions.
		/// </summary>
		public const string InsufficientPermissions = "You do not have permission to perform this action.";

		/// <summary>
		/// Detail for rate limit exceeded.
		/// </summary>
		public const string RateLimitExceeded = "Rate limit exceeded. Please try again later.";

		/// <summary>
		/// Detail for generic bad request (replaces raw exception.Message for framework exceptions).
		/// </summary>
		public const string BadRequest = "The request was invalid. Please check your input.";

		/// <summary>
		/// Detail for generic resource not found (replaces raw KeyNotFoundException messages).
		/// </summary>
		public const string ResourceNotFound = "The requested resource was not found.";

		/// <summary>
		/// Detail for unauthorized access (replaces raw UnauthorizedAccessException messages).
		/// </summary>
		public const string Unauthorized = "You are not authorized to perform this action.";

		/// <summary>
		/// Detail for unprocessable entity (replaces raw domain exception messages).
		/// </summary>
		public const string UnprocessableEntity = "The request could not be processed. Please review your input.";

		/// <summary>
		/// Detail for role assignment failures.
		/// </summary>
		public const string RoleAssignmentFailed = "Role assignment could not be completed.";

		/// <summary>
		/// Detail for role removal failures.
		/// </summary>
		public const string RoleRemovalFailed = "Role removal could not be completed.";

		/// <summary>
		/// Detail for registration failures (replaces raw Identity exception messages).
		/// </summary>
		public const string RegistrationFailed = "Registration could not be completed. Please try again.";

		/// <summary>
		/// Detail for invalid or expired OAuth authorization code.
		/// </summary>
		public const string InvalidOrExpiredCode = "The authorization code is invalid or has expired.";

		/// <summary>
		/// Detail for external login link failures (replaces raw Identity errors).
		/// </summary>
		public const string ExternalLoginLinkFailed = "Failed to link external account. Please try again.";

		/// <summary>
		/// Detail for external login unlink failures (replaces raw Identity errors).
		/// </summary>
		public const string ExternalLoginUnlinkFailed = "Failed to unlink external account. Please try again.";

		/// <summary>
		/// Detail for OAuth user creation failures (replaces raw Identity errors).
		/// </summary>
		public const string OAuthUserCreationFailed = "Account creation could not be completed. Please try again.";

		/// <summary>
		/// Detail for inactive user account.
		/// </summary>
		public const string UserAccountInactive = "User account is inactive.";
	}
}