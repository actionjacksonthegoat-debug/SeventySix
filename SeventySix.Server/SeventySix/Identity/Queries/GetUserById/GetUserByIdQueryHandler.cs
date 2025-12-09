namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving a user by ID.
/// </summary>
public static class GetUserByIdQueryHandler
{
	public static async Task<UserDto?> HandleAsync(
		GetUserByIdQuery query,
		IUserRepository repository,
		CancellationToken cancellationToken)
	{
		User? user =
			await repository.GetByIdAsync(
				query.Id,
				cancellationToken);

		return user?.ToDto();
	}
}
