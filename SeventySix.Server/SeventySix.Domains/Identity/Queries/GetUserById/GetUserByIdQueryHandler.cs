namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving a user by ID.
/// </summary>
public static class GetUserByIdQueryHandler
{
	/// <summary>
	/// Retrieves a user by its identifier and maps to <see cref="UserDto"/> if found.
	/// </summary>
	public static async Task<UserDto?> HandleAsync(
		GetUserByIdQuery query,
		IUserQueryRepository repository,
		CancellationToken cancellationToken)
	{
		User? user =
			await repository.GetByIdAsync(query.Id, cancellationToken);

		return user?.ToDto();
	}
}