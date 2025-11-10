// <copyright file="UserService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;
using SeventySix.Application.Extensions;
using SeventySix.Application.Interfaces;
using SeventySix.Domain.Interfaces;

namespace SeventySix.Application.Services;

/// <summary>
/// User service implementation.
/// Encapsulates business logic for user operations.
/// </summary>
/// <remarks>
/// This service implements the Service Layer pattern, providing a facade over
/// the repository layer while handling business logic and validation.
///
/// Design Principles Applied:
/// - Single Responsibility Principle (SRP): Focuses only on user business logic
/// - Dependency Inversion Principle (DIP): Depends on abstractions (IUserRepository, IValidator)
/// - Open/Closed Principle (OCP): Open for extension via dependency injection, closed for modification
///
/// Responsibilities:
/// - Validate requests using FluentValidation
/// - Coordinate between repository and mapping layers
/// - Enforce business rules
/// - Map between domain entities and DTOs
///
/// Transaction Management: Relies on repository layer for data persistence.
/// Validation: Uses FluentValidation for request validation before processing.
/// </remarks>
public class UserService : IUserService
{
	private readonly IUserRepository Repository;
	private readonly IValidator<CreateUserRequest> CreateValidator;

	/// <summary>
	/// Initializes a new instance of the <see cref="UserService"/> class.
	/// </summary>
	/// <param name="repository">The repository for data access operations.</param>
	/// <param name="createValidator">The validator for create requests.</param>
	/// <exception cref="ArgumentNullException">
	/// Thrown when repository or createValidator is null.
	/// </exception>
	/// <remarks>
	/// Dependencies are injected via constructor following Dependency Injection pattern.
	/// This enables loose coupling and facilitates unit testing with mocks.
	/// </remarks>
	public UserService(
		IUserRepository repository,
		IValidator<CreateUserRequest> createValidator)
	{
		Repository = repository ?? throw new ArgumentNullException(nameof(repository));
		CreateValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Implementation retrieves all users from the repository and maps them to DTOs.
	/// Uses extension methods for clean entity-to-DTO transformation.
	/// </remarks>
	public async Task<IEnumerable<UserDto>> GetAllUsersAsync(CancellationToken cancellationToken = default)
	{
		var users = await Repository.GetAllAsync(cancellationToken);
		return users.ToDto();
	}

	/// <inheritdoc/>
	/// <remarks>
	/// Returns null if the user is not found, allowing the caller to determine
	/// the appropriate response (typically 404 Not Found).
	/// </remarks>
	public async Task<UserDto?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default)
	{
		var user = await Repository.GetByIdAsync(id, cancellationToken);
		return user?.ToDto();
	}

	/// <inheritdoc/>
	/// <exception cref="ValidationException">
	/// Thrown when the request fails validation rules defined in CreateUserValidator.
	/// </exception>
	/// <remarks>
	/// Processing steps:
	/// 1. Validate request using FluentValidation (throws ValidationException if invalid)
	/// 2. Map request to domain entity using extension method
	/// 3. Persist entity via repository
	/// 4. Map created entity to DTO and return
	///
	/// The ValidateAndThrowAsync method ensures validation happens before any processing,
	/// following the fail-fast principle.
	/// </remarks>
	public async Task<UserDto> CreateUserAsync(
		CreateUserRequest request,
		CancellationToken cancellationToken = default)
	{
		// Validate request using FluentValidation
		await CreateValidator.ValidateAndThrowAsync(request, cancellationToken);

		// Map request to entity using extension method
		var user = request.ToEntity();

		// Save via repository
		var created = await Repository.CreateAsync(user, cancellationToken);

		// Map entity to DTO using extension method
		return created.ToDto();
	}
}
