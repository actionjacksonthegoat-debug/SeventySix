// <copyright file="PermissionRequestExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Shouldly;

namespace SeventySix.Identity.Tests.Extensions;

/// <summary>
/// Unit tests for PermissionRequestExtensions.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - ToDto maps all fields from entity to DTO correctly
/// - NavigationProperty RequestedRole.Name is mapped
/// </remarks>
public sealed class PermissionRequestExtensionsTests
{
	#region ToDto Tests

	[Fact]
	public void ToDto_PopulatedRequest_MapsAllFieldsCorrectly()
	{
		// Arrange
		DateTimeOffset createDate =
			new DateTimeOffset(2024, 6, 15, 10, 0, 0, TimeSpan.Zero);

		PermissionRequest request =
			new()
			{
				Id = 42L,
				UserId = 7L,
				RequestedRole =
					new ApplicationRole
					{
						Name = "Administrator",
					},
				RequestMessage = "I need admin access for reporting",
				CreatedBy = "jdoe",
				CreateDate = createDate,
			};

		string username = "john.doe";

		// Act
		PermissionRequestDto dto =
			request.ToDto(username);

		// Assert
		dto.Id.ShouldBe(42L);
		dto.UserId.ShouldBe(7L);
		dto.Username.ShouldBe("john.doe");
		dto.RequestedRole.ShouldBe("Administrator");
		dto.RequestMessage.ShouldBe("I need admin access for reporting");
		dto.CreatedBy.ShouldBe("jdoe");
		dto.CreateDate.ShouldBe(createDate);
	}

	[Fact]
	public void ToDto_NullRequestMessage_MapsNullToDto()
	{
		// Arrange
		PermissionRequest request =
			new()
			{
				Id = 1L,
				UserId = 2L,
				RequestedRole =
					new ApplicationRole
					{
						Name = "Moderator",
					},
				RequestMessage = null,
				CreatedBy = "system",
				CreateDate = DateTimeOffset.UtcNow,
			};

		// Act
		PermissionRequestDto dto =
			request.ToDto("someuser");

		// Assert
		dto.RequestMessage.ShouldBeNull();
		dto.RequestedRole.ShouldBe("Moderator");
	}

	#endregion
}