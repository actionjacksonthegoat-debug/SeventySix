// <copyright file="UpdateUserRequestTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using SeventySix.Identity;

namespace SeventySix.Tests.Identity;

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
		request.Id.Should().Be(1);
		request.Username.Should().Be("testuser");
		request.Email.Should().Be("test@example.com");
		request.FullName.Should().Be("Test User");
		request.IsActive.Should().BeTrue();
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
		request.FullName.Should().BeNull();
	}
}