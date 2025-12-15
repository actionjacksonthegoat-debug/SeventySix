// <copyright file="UpdateUserRequestTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.DTOs;

/// <summary>
/// Unit tests for <see cref="UpdateUserRequest"/>.
/// </summary>
public class UpdateUserRequestTests
{
	[Fact]
	public void UpdateUserRequest_ShouldCreateInstance_WithValidData()
	{
		// Arrange & Act
		UpdateUserRequest request = new()
		{
			Id = 1,
			Username = "testuser",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = true,
		};

		// Assert
		request.Id.ShouldBe(1);
		request.Username.ShouldBe("testuser");
		request.Email.ShouldBe("test@example.com");
		request.FullName.ShouldBe("Test User");
		request.IsActive.ShouldBeTrue();
	}

	[Fact]
	public void UpdateUserRequest_ShouldAllowNullFullName()
	{
		// Arrange & Act
		UpdateUserRequest request = new()
		{
			Id = 1,
			Username = "testuser",
			Email = "test@example.com",
			FullName = null,
			IsActive = true,
		};

		// Assert
		request.FullName.ShouldBeNull();
	}
}
