namespace SeventySix.Identity;

public static class CheckEmailExistsQueryHandler
{
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