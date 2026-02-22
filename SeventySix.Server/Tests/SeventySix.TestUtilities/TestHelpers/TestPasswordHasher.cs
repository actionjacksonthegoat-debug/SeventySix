// <copyright file="TestPasswordHasher.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;
using SeventySix.Identity;

namespace SeventySix.TestUtilities.TestHelpers;

/// <summary>
/// Test password hasher with reduced parameters for fast test execution.
/// </summary>
/// <remarks>
/// <para>
/// Uses reduced Argon2id parameters for test performance:
/// - Memory: 4 MB (vs 64 MB production)
/// - Iterations: 2 (vs 3 production)
/// - Parallelism: 1 (vs 4 production)
/// </para>
/// <para>
/// NEVER use this in production - security parameters are intentionally weak.
/// </para>
/// </remarks>
public sealed class TestPasswordHasher : IPasswordHasher
{
	private const int SaltSize = 16;
	private const int HashSize = 16; // Smaller for tests
	private const int MemorySize = 4096; // 4 MB
	private const int Iterations = 2;
	private const int Parallelism = 1;

	/// <inheritdoc/>
	public string HashPassword(string password)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(password);

		byte[] salt =
			RandomNumberGenerator.GetBytes(SaltSize);

		byte[] hash =
			ComputeHash(password, salt);

		string encodedHash =
			$"$argon2id$v=19$m={MemorySize},t={Iterations},"
				+ $"p={Parallelism}${Convert.ToBase64String(salt)}$"
				+ $"{Convert.ToBase64String(hash)}";

		return encodedHash;
	}

	/// <inheritdoc/>
	public bool VerifyPassword(string password, string passwordHash)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(password);
		ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

		if (!passwordHash.StartsWith("$argon2id$", StringComparison.Ordinal))
		{
			return false;
		}

		string[] parts =
			passwordHash.Split(
				'$',
				StringSplitOptions.RemoveEmptyEntries);

		if (parts.Length != 5)
		{
			return false;
		}

		(int memory, int iterations, int parallelism)? parameters =
			ParseParameters(parts[2]);

		if (parameters is null)
		{
			return false;
		}

		byte[] salt;
		byte[] storedHash;
		try
		{
			salt =
				Convert.FromBase64String(parts[3]);
			storedHash =
				Convert.FromBase64String(parts[4]);
		}
		catch (FormatException)
		{
			return false;
		}

		byte[] computedHash =
			ComputeHashWithParams(
				password,
				salt,
				parameters.Value.memory,
				parameters.Value.iterations,
				parameters.Value.parallelism,
				storedHash.Length);

		return CryptographicOperations.FixedTimeEquals(
			storedHash,
			computedHash);
	}

	private static byte[] ComputeHash(string password, byte[] salt)
	{
		using Argon2id argon2 =
			new(Encoding.UTF8.GetBytes(password))
			{
				Salt = salt,
				MemorySize = MemorySize,
				Iterations = Iterations,
				DegreeOfParallelism = Parallelism,
			};

		return argon2.GetBytes(HashSize);
	}

	private static byte[] ComputeHashWithParams(
		string password,
		byte[] salt,
		int memorySize,
		int iterations,
		int parallelism,
		int hashSize)
	{
		using Argon2id argon2 =
			new(Encoding.UTF8.GetBytes(password))
			{
				Salt = salt,
				MemorySize = memorySize,
				Iterations = iterations,
				DegreeOfParallelism = parallelism,
			};

		return argon2.GetBytes(hashSize);
	}

	private static (
		int memory,
		int iterations,
		int parallelism
	)? ParseParameters(string parametersString)
	{
		string[] paramParts =
			parametersString.Split(',');

		if (paramParts.Length != 3)
		{
			return null;
		}

		int? memory =
			ParseParameter(
			paramParts[0],
			"m=");
		int? iterations =
			ParseParameter(
			paramParts[1],
			"t=");
		int? parallelism =
			ParseParameter(
			paramParts[2],
			"p=");

		if (memory is null || iterations is null || parallelism is null)
		{
			return null;
		}

		return (memory.Value, iterations.Value, parallelism.Value);
	}

	private static int? ParseParameter(string part, string prefix)
	{
		if (!part.StartsWith(prefix, StringComparison.Ordinal))
		{
			return null;
		}

		if (int.TryParse(
			part[prefix.Length..],
			out int value))
		{
			return value;
		}

		return null;
	}
}