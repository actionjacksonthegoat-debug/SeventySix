// <copyright file="TotpSecretProtectorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.DataProtection;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="TotpSecretProtector"/>.
/// Verifies round-trip encryption and nonce uniqueness.
/// </summary>
public class TotpSecretProtectorUnitTests
{
	private readonly TotpSecretProtector Protector;

	public TotpSecretProtectorUnitTests()
	{
		IDataProtectionProvider provider =
			DataProtectionProvider.Create("SeventySix.Tests");

		Protector =
			new TotpSecretProtector(provider);
	}

	[Fact]
	public void Protect_ReturnsEncryptedString_DifferentFromInput()
	{
		// Arrange
		string plaintextSecret = "JBSWY3DPEHPK3PXP";

		// Act
		string encrypted =
			Protector.Protect(plaintextSecret);

		// Assert
		encrypted.ShouldNotBe(plaintextSecret);
		encrypted.ShouldNotBeNullOrWhiteSpace();
	}

	[Fact]
	public void Unprotect_ReturnsOriginalString_AfterRoundTrip()
	{
		// Arrange
		string plaintextSecret = "JBSWY3DPEHPK3PXP";

		// Act
		string encrypted =
			Protector.Protect(plaintextSecret);
		string decrypted =
			Protector.Unprotect(encrypted);

		// Assert
		decrypted.ShouldBe(plaintextSecret);
	}

	[Fact]
	public void Protect_SameInput_ProducesDifferentOutputs()
	{
		// Arrange
		string plaintextSecret = "JBSWY3DPEHPK3PXP";

		// Act
		string encrypted1 =
			Protector.Protect(plaintextSecret);
		string encrypted2 =
			Protector.Protect(plaintextSecret);

		// Assert — Data Protection API uses unique nonces
		encrypted1.ShouldNotBe(encrypted2);
	}
}