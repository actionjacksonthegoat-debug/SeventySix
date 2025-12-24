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
	/// <param name="repository">
	/// Repository used to check email existence.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the email exists; otherwise false.
	/// </returns>
	public static async Task<bool> HandleAsync(
		CheckEmailExistsQuery query,
		IUserQueryRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.EmailExistsAsync(
			query.Email,
			query.ExcludeUserId,
			cancellationToken);
	}
}