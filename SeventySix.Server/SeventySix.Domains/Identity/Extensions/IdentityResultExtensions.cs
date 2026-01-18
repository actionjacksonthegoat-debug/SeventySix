using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Utility extensions for working with Identity results and errors.
/// </summary>
public static class IdentityResultExtensions
{
	/// <summary>
	/// Converts an enumerable of IdentityError objects into a single comma-separated string of descriptions.
	/// Returns empty string for null or empty input.
	/// </summary>
	/// <param name="errors">
	/// The collection of IdentityError objects.
	/// </param>
	/// <returns>
	/// A comma-separated string of error descriptions.
	/// </returns>
	public static string ToErrorString(
		this IEnumerable<IdentityError>? errors) =>
		errors is null
			? string.Empty
			: string.Join(
				", ",
				errors.Select(error => error.Description));

	/// <summary>
	/// Converts an IdentityResult's errors into a single comma-separated string.
	/// Returns empty string if the result is null or contains no errors.
	/// </summary>
	public static string ToErrorString(
		this IdentityResult? result) =>
			result?.Errors.ToErrorString() ?? string.Empty;
}