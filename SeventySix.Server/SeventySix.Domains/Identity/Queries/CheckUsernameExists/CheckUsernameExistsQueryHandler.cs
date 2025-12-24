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
	/// <param name="repository">
	/// Repository used to check username existence.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the username exists; otherwise false.
	/// </returns>
	public static async Task<bool> HandleAsync(
		CheckUsernameExistsQuery query,
		IUserQueryRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.UsernameExistsAsync(
			query.Username,
			query.ExcludeUserId,
			cancellationToken);
	}
}