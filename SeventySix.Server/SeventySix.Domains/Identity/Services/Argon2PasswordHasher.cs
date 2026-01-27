// <copyright file="Argon2PasswordHasher.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;
using Microsoft.Extensions.Options;

namespace SeventySix.Identity;

/// <summary>
/// Password hasher using Argon2id algorithm.
/// </summary>
/// <remarks>
/// <para>
/// Argon2id is the recommended password hashing algorithm per OWASP 2024.
/// It combines Argon2i (side-channel resistance) and Argon2d (GPU resistance).
/// </para>
/// <para>
/// Default Parameters (OWASP recommended for interactive logins):
/// - Memory: 64 MB (65536 KB)
/// - Iterations: 3
/// - Parallelism: 4 threads
/// - Salt: 16 bytes (128 bits)
/// - Hash: 32 bytes (256 bits)
/// </para>
/// <para>
/// Hash Format: $argon2id$v=19$m={memory},t={iterations},p={parallelism}${salt}${hash}
/// </para>
/// </remarks>
public class Argon2PasswordHasher(IOptions<AuthSettings> authSettings)
	: IPasswordHasher
{
	private const int SaltSize = 16;
	private const int HashSize = 32;

	/// <inheritdoc/>
	public string HashPassword(string password)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(password);

		Argon2Settings settings =
			authSettings.Value.Password.Argon2;

		byte[] salt =
			RandomNumberGenerator.GetBytes(SaltSize);

		byte[] hash =
			ComputeHash(
				password,
				salt,
				settings.MemorySize,
				settings.Iterations,
				settings.DegreeOfParallelism);

		// Format: $argon2id$v=19$m={memory},t={iterations},p={parallelism}${salt}${hash}
		string encodedHash =
			$"$argon2id$v=19$m={settings.MemorySize},t={settings.Iterations},"
				+ $"p={settings.DegreeOfParallelism}${Convert.ToBase64String(salt)}$"
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

		// Parse: $argon2id$v=19$m={memory},t={iterations},p={parallelism}${salt}${hash}
		string[] parts =
			passwordHash.Split(
				'$',
				StringSplitOptions.RemoveEmptyEntries);

		if (parts.Length != 5)
		{
			return false;
		}

		// parts[0] = "argon2id"
		// parts[1] = "v=19"
		// parts[2] = "m=65536,t=3,p=4"
		// parts[3] = base64(salt)
		// parts[4] = base64(hash)

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
			ComputeHash(
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

	/// <summary>
	/// Computes Argon2id hash for the provided password and parameters.
	/// </summary>
	private static byte[] ComputeHash(
		string password,
		byte[] salt,
		int memorySize,
		int iterations,
		int parallelism,
		int hashSize = HashSize)
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

	/// <summary>
	/// Parses the Argon2 parameter string (e.g., "m=65536,t=3,p=4").
	/// </summary>
	private static (
		int memory,
		int iterations,
		int parallelism
	)? ParseParameters(string parametersString)
	{
		// Format: m=65536,t=3,p=4
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

	/// <summary>
	/// Parses a single parameter value from a "key=value" part.
	/// </summary>
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