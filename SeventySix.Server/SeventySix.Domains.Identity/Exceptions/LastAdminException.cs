// <copyright file="LastAdminException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Exceptions;

namespace SeventySix.Identity;

/// <summary>
/// Exception thrown when attempting to remove the Admin role from the last admin user.
/// This represents a business rule violation - at least one admin must exist in the system.
/// </summary>
/// <remarks>
/// This exception enforces the critical business rule that the system must always have
/// at least one administrator. Removing the Admin role from the last remaining admin
/// would lock out all administrative access.
///
/// When to Use:
/// - Removing the Admin role from a user who is the only admin
///
/// When NOT to Use:
/// - Removing non-Admin roles from users
/// - Removing Admin role when other admins exist
/// - User deletion (separate validation logic)
///
/// HTTP Mapping:
/// - Maps to 409 Conflict in controllers
/// - Client should display appropriate message to prevent role removal
///
/// Usage Example:
/// <code>
/// IList&lt;ApplicationUser&gt; adminUsers = await userManager.GetUsersInRoleAsync(RoleConstants.Admin);
/// bool isLastAdmin = adminUsers.Count &lt;= 1 &amp;&amp; adminUsers.Any(adminUser =&gt; adminUser.Id == userId);
/// if (isLastAdmin)
/// {
///     throw new LastAdminException();
/// }
/// </code>
/// </remarks>
public sealed class LastAdminException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="LastAdminException"/> class with a default message.
	/// </summary>
	public LastAdminException()
		: base("Cannot remove Admin role from the last admin user. At least one admin must exist.")
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="LastAdminException"/> class with a custom message.
	/// </summary>
	/// <param name="message">
	/// The custom error message describing the exception.
	/// </param>
	public LastAdminException(string message)
		: base(message)
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="LastAdminException"/> class with a message and inner exception.
	/// </summary>
	/// <param name="message">
	/// The error message that explains the reason for the exception.
	/// </param>
	/// <param name="innerException">
	/// The exception that is the cause of the current exception.
	/// </param>
	public LastAdminException(string message, Exception innerException)
		: base(message, innerException)
	{
	}
}