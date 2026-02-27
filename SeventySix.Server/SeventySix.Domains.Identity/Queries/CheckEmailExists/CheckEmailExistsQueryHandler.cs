using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Handles <see cref="CheckEmailExistsQuery"/> queries.
/// </summary>
public static class CheckEmailExistsQueryHandler
{
	/// <summary>
	/// Determines whether the specified email already exists in the system.
	/// </summary>
	/// <param name="query">
	/// The query containing the email and optional exclusion user id.
	/// </param>
	/// <param name="userManager">
	/// User manager used to check email existence.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the email exists; otherwise false.
	/// </returns>
	public static async Task<bool> HandleAsync(
		CheckEmailExistsQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		IQueryable<ApplicationUser> usersQuery =
			userManager
				.Users
				.AsNoTracking()
				.Where(user =>
					user.NormalizedEmail != null
					&& user.NormalizedEmail == query.Email.ToUpperInvariant());

		if (query.ExcludeUserId.HasValue)
		{
			long excludeId =
				query.ExcludeUserId.Value;
			usersQuery =
				usersQuery.Where(user =>
					user.Id != excludeId);
		}

		return await usersQuery.AnyAsync(cancellationToken);
	}
}