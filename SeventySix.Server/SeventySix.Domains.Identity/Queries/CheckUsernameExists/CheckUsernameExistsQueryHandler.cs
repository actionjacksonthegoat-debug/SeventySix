using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Handles <see cref="CheckUsernameExistsQuery"/> queries.
/// </summary>
public static class CheckUsernameExistsQueryHandler
{
	/// <summary>
	/// Determines whether the specified username already exists in the system.
	/// </summary>
	/// <param name="query">
	/// The query containing the username and optional exclusion user id.
	/// </param>
	/// <param name="userManager">
	/// User manager used to check username existence.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the username exists; otherwise false.
	/// </returns>
	public static async Task<bool> HandleAsync(
		CheckUsernameExistsQuery query,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		IQueryable<ApplicationUser> usersQuery =
			userManager
				.Users
				.AsNoTracking()
				.Where(user =>
					user.UserName != null
					&& user.UserName.ToLower() == query.Username.ToLower());

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