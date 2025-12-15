namespace SeventySix.Identity;

public record CheckEmailExistsQuery(
	string Email,
	int? ExcludeUserId);