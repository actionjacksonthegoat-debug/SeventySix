namespace SeventySix.Identity;

public record CheckUsernameExistsQuery(
	string Username,
	int? ExcludeUserId);
