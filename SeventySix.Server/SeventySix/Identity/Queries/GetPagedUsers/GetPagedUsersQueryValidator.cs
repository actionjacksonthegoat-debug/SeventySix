using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validator for GetPagedUsersQuery that delegates to the UserQueryRequest validator.
/// </summary>
public class GetPagedUsersQueryValidator : AbstractValidator<GetPagedUsersQuery>
{
	public GetPagedUsersQueryValidator(
		IValidator<UserQueryRequest> requestValidator)
	{
		RuleFor(query => query.Request)
			.SetValidator(requestValidator);
	}
}