// <copyright file="ValidationRegistrationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Linq.Expressions;
using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Shared.Validators;

namespace SeventySix.Shared.Registration;

/// <summary>
/// Extension methods for registering FluentValidation validators in a domain assembly.
/// </summary>
public static class ValidationRegistrationExtensions
{
	/// <summary>
	/// Registers all FluentValidation validators from the assembly containing TMarker.
	/// Also auto-registers command validators that wrap request validators (if command has a Request property).
	/// </summary>
	/// <typeparam name="TMarker">
	/// A type in the assembly to scan for validators.
	/// </typeparam>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddDomainValidatorsFromAssemblyContaining<TMarker>(
		this IServiceCollection services)
	{
		// Register concrete validators (FluentValidation scanning)
		services.AddValidatorsFromAssemblyContaining<TMarker>();

		// Auto-register command validators for types with a 'Request' property when a request validator exists
		Assembly assembly =
			typeof(TMarker).Assembly;

		Type[] assemblyTypes =
			assembly.GetTypes();

		foreach (Type candidate in assemblyTypes)
		{
			if (candidate.IsAbstract || !candidate.IsClass)
			{
				continue;
			}

			// Heuristic: Command types commonly end with 'Command' (we look for 'Command')
			if (!candidate.Name.EndsWith("Command", StringComparison.Ordinal))
			{
				continue;
			}

			PropertyInfo? requestProp =
				candidate.GetProperty("Request");

			if (requestProp == null)
			{
				continue;
			}

			Type requestType =
				requestProp.PropertyType;

			// If a validator for requestType is registered in assembly, register validator for command
			Type validatorInterface =
				typeof(IValidator<>);

			Type validatorForRequest =
				validatorInterface.MakeGenericType(
					requestType);

			// Find the validator implementation type in assembly
			Type? validatorImpl =
				assemblyTypes.FirstOrDefault(type =>
					validatorForRequest.IsAssignableFrom(type)
						&& !type.IsAbstract
						&& type.IsClass);

			if (validatorImpl is null)
			{
				continue;
			}

			// Register IValidator<Command> using CommandValidatorFactory with resolved IValidator<Request>
			Type validatorForCommand =
				typeof(IValidator<>).MakeGenericType(
					candidate);

			services.AddSingleton(
				validatorForCommand,
				serviceProvider =>
				{
					object requestValidator =
						serviceProvider.GetRequiredService(validatorForRequest);

					// Build expression: (TCommand cmd) => (TRequest)cmd.Request
					ParameterExpression commandParam =
						Expression.Parameter(
							candidate,
							"command");

					MemberExpression requestAccess =
						Expression.Property(
							commandParam,
							requestProp);

					Type funcType =
						typeof(Func<,>);

					Type lambdaType =
						funcType.MakeGenericType(
							candidate,
							requestType);

					LambdaExpression lambda =
						Expression.Lambda(
							lambdaType,
							requestAccess,
							commandParam);

					// Call CommandValidatorFactory.CreateFor<TCommand, TRequest>(...)
					Type factoryType =
						typeof(CommandValidatorFactory);

					MethodInfo? methodInfo =
						factoryType.GetMethod("CreateFor");

					MethodInfo createMethod =
						methodInfo!.MakeGenericMethod(
							candidate,
							requestType);

					object[] arguments =
						[requestValidator, lambda];

					object result =
						createMethod.Invoke(null, arguments)!;

					return result;
				});
		}

		return services;
	}
}