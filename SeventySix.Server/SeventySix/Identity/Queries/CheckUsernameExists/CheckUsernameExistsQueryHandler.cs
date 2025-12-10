namespace SeventySix.Identity;

public static class CheckUsernameExistsQueryHandler
{
	public static async Task<bool> HandleAsync(
		CheckUsernameExistsQuery query,
		IUserValidationRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.UsernameExistsAsync(
			query.Username,
			query.ExcludeUserId,
			cancellationToken);
	}
}