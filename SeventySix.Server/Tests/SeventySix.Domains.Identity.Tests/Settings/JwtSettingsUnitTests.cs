// <copyright file="JwtSettingsUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Identity.Tests.Settings;

/// <summary>
/// Unit tests for <see cref="JwtSettings"/>.
/// Focus: <see cref="JwtSettings.GetEffectiveKeyId"/> branching and
/// <see cref="JwtSettings.ComputeKeyFingerprint"/> determinism and format.
/// </summary>
public sealed class JwtSettingsUnitTests
{
	/// <summary>
	/// Verifies that when <see cref="JwtSettings.KeyId"/> is null,
	/// <see cref="JwtSettings.GetEffectiveKeyId"/> returns a computed fingerprint.
	/// </summary>
	[Fact]
	public void GetEffectiveKeyId_KeyIdNotSet_ReturnsComputedFingerprint()
	{
		JwtSettings settings =
			new() { SecretKey = "my-secret-key", KeyId = null };

		string result = settings.GetEffectiveKeyId();

		result.ShouldBe(JwtSettings.ComputeKeyFingerprint("my-secret-key"));
	}

	/// <summary>
	/// Verifies that when <see cref="JwtSettings.KeyId"/> is empty,
	/// <see cref="JwtSettings.GetEffectiveKeyId"/> returns a computed fingerprint.
	/// </summary>
	[Fact]
	public void GetEffectiveKeyId_KeyIdEmpty_ReturnsComputedFingerprint()
	{
		JwtSettings settings =
			new() { SecretKey = "my-secret-key", KeyId = string.Empty };

		string result = settings.GetEffectiveKeyId();

		result.ShouldBe(JwtSettings.ComputeKeyFingerprint("my-secret-key"));
	}

	/// <summary>
	/// Verifies that when <see cref="JwtSettings.KeyId"/> is set,
	/// <see cref="JwtSettings.GetEffectiveKeyId"/> returns it directly without computing a fingerprint.
	/// </summary>
	[Fact]
	public void GetEffectiveKeyId_KeyIdSet_ReturnsKeyId()
	{
		JwtSettings settings =
			new() { SecretKey = "my-secret-key", KeyId = "my-key-id" };

		string result = settings.GetEffectiveKeyId();

		result.ShouldBe("my-key-id");
	}

	/// <summary>
	/// Verifies that <see cref="JwtSettings.ComputeKeyFingerprint"/> is deterministic for the same input.
	/// </summary>
	[Fact]
	public void ComputeKeyFingerprint_SameInput_ReturnsSameResult()
	{
		string first =
			JwtSettings.ComputeKeyFingerprint("test-key");
		string second =
			JwtSettings.ComputeKeyFingerprint("test-key");

		first.ShouldBe(second);
	}

	/// <summary>
	/// Verifies that <see cref="JwtSettings.ComputeKeyFingerprint"/> produces different output for different inputs.
	/// </summary>
	[Fact]
	public void ComputeKeyFingerprint_DifferentInput_ReturnsDifferentResult()
	{
		string first =
			JwtSettings.ComputeKeyFingerprint("key-one");
		string second =
			JwtSettings.ComputeKeyFingerprint("key-two");

		first.ShouldNotBe(second);
	}

	/// <summary>
	/// Verifies that <see cref="JwtSettings.ComputeKeyFingerprint"/> always returns exactly 8 characters.
	/// </summary>
	[Theory]
	[InlineData("short")]
	[InlineData("a-much-longer-secret-key-value-for-production-use")]
	[InlineData("another-key")]
	public void ComputeKeyFingerprint_AnyInput_Returns8Characters(string secretKey)
	{
		string result =
			JwtSettings.ComputeKeyFingerprint(secretKey);

		result.Length.ShouldBe(8);
	}
}
