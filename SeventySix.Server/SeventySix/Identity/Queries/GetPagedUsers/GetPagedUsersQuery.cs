namespace SeventySix.Identity;

/// <summary>
/// Query to retrieve a paginated list of users.
/// </summary>
/// <param name="Request">The pagination and filter criteria.</param>
public record GetPagedUsersQuery(
	UserQueryRequest Request);
