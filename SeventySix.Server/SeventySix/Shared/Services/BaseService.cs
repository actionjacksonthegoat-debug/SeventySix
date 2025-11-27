using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace SeventySix.Shared.Services;

/// <summary>
/// Base class for all service layer classes providing common functionality
/// including structured logging, operation timing, and input validation.
/// Implements Template Method pattern for consistent service behavior.
/// </summary>
/// <remarks>
/// This class provides:
/// - Automatic operation logging with timing
/// - Consistent error logging
/// - Common validation methods
/// - Template methods for derived services
/// </remarks>
public abstract class BaseService(ILogger<BaseService> logger)
{
	/// <summary>
	/// Executes an operation with automatic logging of start, completion, timing, and errors.
	/// </summary>
	/// <typeparam name="T">The return type of the operation.</typeparam>
	/// <param name="operation">The operation to execute.</param>
	/// <param name="operationName">The name of the operation for logging.</param>
	/// <param name="cancellationToken">Cancellation token to observe.</param>
	/// <returns>The result of the operation.</returns>
	/// <exception cref="ArgumentNullException">Thrown when operation or operationName is null.</exception>
	protected async Task<T> ExecuteWithLoggingAsync<T>(
		Func<Task<T>> operation,
		string operationName,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(operation);
		ValidateNotNullOrEmpty(operationName, nameof(operationName));

		Stopwatch stopwatch = Stopwatch.StartNew();
		logger.LogInformation("Starting {OperationName}", operationName);

		try
		{
			T result = await operation();
			stopwatch.Stop();
			logger.LogInformation(
				"Completed {OperationName} in {ElapsedMilliseconds}ms",
				operationName,
				stopwatch.ElapsedMilliseconds);
			return result;
		}
		catch (Exception exception)
		{
			stopwatch.Stop();
			logger.LogError(
				exception,
				"Error in {OperationName} after {ElapsedMilliseconds}ms",
				operationName,
				stopwatch.ElapsedMilliseconds);
			throw;
		}
	}

	/// <summary>
	/// Validates that a string parameter is not null, empty, or whitespace.
	/// </summary>
	/// <param name="value">The value to validate.</param>
	/// <param name="parameterName">The name of the parameter for exception messages.</param>
	/// <exception cref="ArgumentNullException">Thrown when value is null.</exception>
	/// <exception cref="ArgumentException">Thrown when value is empty or whitespace.</exception>
	protected static void ValidateNotNullOrEmpty(string? value, string parameterName)
	{
		ArgumentNullException.ThrowIfNull(value, parameterName);
		if (string.IsNullOrWhiteSpace(value))
		{
			throw new ArgumentException($"Parameter {parameterName} cannot be empty or whitespace.", parameterName);
		}
	}

	/// <summary>
	/// Validates that a collection is not null or empty.
	/// </summary>
	/// <typeparam name="T">The type of elements in the collection.</typeparam>
	/// <param name="collection">The collection to validate.</param>
	/// <param name="parameterName">The name of the parameter for exception messages.</param>
	/// <exception cref="ArgumentNullException">Thrown when collection is null.</exception>
	/// <exception cref="ArgumentException">Thrown when collection is empty.</exception>
	protected static void ValidateNotNullOrEmpty<T>(IEnumerable<T>? collection, string parameterName)
	{
		ArgumentNullException.ThrowIfNull(collection, parameterName);
		if (!collection.Any())
		{
			throw new ArgumentException($"Parameter {parameterName} cannot be empty.", parameterName);
		}
	}

	/// <summary>
	/// Validates that a value is within an acceptable range.
	/// </summary>
	/// <typeparam name="T">The type of value to validate.</typeparam>
	/// <param name="value">The value to validate.</param>
	/// <param name="minimumValue">The minimum acceptable value (inclusive).</param>
	/// <param name="maximumValue">The maximum acceptable value (inclusive).</param>
	/// <param name="parameterName">The name of the parameter for exception messages.</param>
	/// <exception cref="ArgumentOutOfRangeException">Thrown when value is outside the acceptable range.</exception>
	protected static void ValidateRange<T>(T value, T minimumValue, T maximumValue, string parameterName)
		where T : IComparable<T>
	{
		if (value.CompareTo(minimumValue) < 0 || value.CompareTo(maximumValue) > 0)
		{
			throw new ArgumentOutOfRangeException(
				parameterName,
				value,
				$"Parameter {parameterName} must be between {minimumValue} and {maximumValue}.");
		}
	}
}
