// <copyright file="MemoryPackSerializationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using MemoryPack;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Identity;
using Shouldly;
using Xunit;

namespace SeventySix.Shared.Tests.Registration;

/// <summary>
/// Tests for MemoryPack serialization of cacheable DTOs.
/// </summary>
/// <remarks>
/// Follows 80/20 rule: tests critical path (round-trip serialization) only.
/// Note: LogDto intentionally not cached per Microsoft best practices - logs are write-heavy.
/// </remarks>
public class MemoryPackSerializationTests
{
	/// <summary>
	/// Verifies that UserDto round-trips through MemoryPack serialization correctly.
	/// </summary>
	[Fact]
	public void UserDto_SerializeDeserialize_RoundTripsCorrectly()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(new DateTimeOffset(
				2024,
				1,
				15,
				10,
				30,
				0,
				TimeSpan.Zero));

		UserDto original =
			new(
				Id: 42,
				Username: "testuser",
				Email: "test@example.com",
				FullName: "Test User",
				CreateDate: timeProvider.GetUtcNow().UtcDateTime,
				IsActive: true,
				CreatedBy: "admin",
				ModifyDate: null,
				ModifiedBy: "",
				LastLoginAt: timeProvider.GetUtcNow().UtcDateTime,
				IsDeleted: false,
				DeletedAt: null,
				DeletedBy: null);

		// Act
		byte[] serialized =
			MemoryPackSerializer.Serialize(original);

		UserDto? deserialized =
			MemoryPackSerializer.Deserialize<UserDto>(serialized);

		// Assert
		deserialized.ShouldNotBeNull();
		deserialized.Id.ShouldBe(original.Id);
		deserialized.Username.ShouldBe(original.Username);
		deserialized.Email.ShouldBe(original.Email);
		deserialized.IsActive.ShouldBe(original.IsActive);
		deserialized.CreateDate.ShouldBe(original.CreateDate);
	}

	/// <summary>
	/// Verifies that MemoryPack produces smaller payloads than JSON serialization for UserDto.
	/// </summary>
	[Fact]
	public void UserDto_MemoryPackPayload_IsSmallerThanJson()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();

		UserDto dto =
			new(
				Id: 1,
				Username: "testuser",
				Email: "test@example.com",
				FullName: "Test User",
				CreateDate: timeProvider.GetUtcNow().UtcDateTime,
				IsActive: true,
				CreatedBy: "admin",
				ModifyDate: null,
				ModifiedBy: "",
				LastLoginAt: null,
				IsDeleted: false,
				DeletedAt: null,
				DeletedBy: null);

		// Act
		byte[] memoryPackBytes =
			MemoryPackSerializer.Serialize(dto);

		string jsonString =
			System.Text.Json.JsonSerializer.Serialize(dto);

		byte[] jsonBytes =
			System.Text.Encoding.UTF8.GetBytes(jsonString);

		// Assert - MemoryPack should produce smaller payloads
		memoryPackBytes.Length.ShouldBeLessThan(jsonBytes.Length);
	}

	/// <summary>
	/// Verifies that UserProfileDto round-trips through MemoryPack serialization correctly.
	/// </summary>
	[Fact]
	public void UserProfileDto_SerializeDeserialize_RoundTripsCorrectly()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(new DateTimeOffset(
				2024,
				1,
				15,
				10,
				30,
				0,
				TimeSpan.Zero));

		UserProfileDto original =
			new(
				Id: 42,
				Username: "testuser",
				Email: "test@example.com",
				FullName: "Test User",
				Roles: ["Developer", "Admin"],
				HasPassword: true,
				LinkedProviders: ["Google"],
				LastLoginAt: timeProvider.GetUtcNow().UtcDateTime);

		// Act
		byte[] serialized =
			MemoryPackSerializer.Serialize(original);

		UserProfileDto? deserialized =
			MemoryPackSerializer.Deserialize<UserProfileDto>(serialized);

		// Assert
		deserialized.ShouldNotBeNull();
		deserialized.Id.ShouldBe(original.Id);
		deserialized.Username.ShouldBe(original.Username);
		deserialized.Email.ShouldBe(original.Email);
		deserialized.Roles.ShouldBe(original.Roles);
		deserialized.HasPassword.ShouldBe(original.HasPassword);
	}

	/// <summary>
	/// Verifies that AvailableRoleDto round-trips through MemoryPack serialization correctly.
	/// </summary>
	[Fact]
	public void AvailableRoleDto_SerializeDeserialize_RoundTripsCorrectly()
	{
		// Arrange
		AvailableRoleDto original =
			new(
				Name: "Developer",
				Description: "Standard developer access");

		// Act
		byte[] serialized =
			MemoryPackSerializer.Serialize(original);

		AvailableRoleDto? deserialized =
			MemoryPackSerializer.Deserialize<AvailableRoleDto>(serialized);

		// Assert
		deserialized.ShouldNotBeNull();
		deserialized.Name.ShouldBe(original.Name);
		deserialized.Description.ShouldBe(original.Description);
	}
}