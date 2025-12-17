# Identity Domain Security Audit - Implementation Plan

> **Document Version:** 1.0
> **Created:** December 15, 2025
> **Principles:** KISS, DRY, YAGNI | TDD with 80/20 Rule

---

## Executive Summary

This document provides a comprehensive security audit of the SeventySix Identity Domain, analyzing database schema security, client/server exposed properties, and recommending actionable improvements. The audit follows OWASP security guidelines and GDPR compliance considerations.

---

## Table of Contents

1. [Database Schema Security Audit](#1-database-schema-security-audit)
2. [Security Findings Summary](#2-security-findings-summary)
3. [Email Storage Analysis](#3-email-storage-analysis)
4. [Server-Side Exposed Properties](#4-server-side-exposed-properties)
5. [Client-Side Exposed Properties](#5-client-side-exposed-properties)
6. [Recommended Actions](#6-recommended-actions)
7. [Implementation Tasks](#7-implementation-tasks)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. Database Schema Security Audit

### 1.1 Identity Entities Overview

| Entity                   | Security Status | Risk Level | Notes                                          |
| ------------------------ | --------------- | ---------- | ---------------------------------------------- |
| `User`                   | ✅ PASS         | LOW        | No sensitive data stored; audit fields present |
| `UserCredential`         | ✅ PASS         | LOW        | Password hashed with BCrypt (work factor 12)   |
| `RefreshToken`           | ✅ PASS         | LOW        | Token SHA256 hashed; rotation implemented      |
| `PasswordResetToken`     | ⚠️ REVIEW       | MEDIUM     | Token stored in plaintext (64-byte base64)     |
| `EmailVerificationToken` | ⚠️ REVIEW       | MEDIUM     | Token stored in plaintext                      |
| `ExternalLogin`          | ✅ PASS         | LOW        | No sensitive OAuth tokens stored               |
| `SecurityRole`           | ✅ PASS         | LOW        | Lookup table only                              |
| `UserRole`               | ✅ PASS         | LOW        | Junction table with audit fields               |
| `PermissionRequest`      | ✅ PASS         | LOW        | No sensitive data                              |

### 1.2 Column-Level Security Analysis

#### User Entity (`identity.Users`)

```csharp
// Current columns - ALL PASS security review
public int Id { get; set; }                    // ✅ Auto-generated PK
public string Username { get; set; }           // ✅ Non-sensitive identifier
public string Email { get; set; }              // ⚠️ REVIEW - See Section 3
public string? FullName { get; set; }          // ⚠️ PII - Consider implications
public DateTime CreateDate { get; set; }       // ✅ Audit field
public string CreatedBy { get; set; }          // ✅ Audit field (username, not FK)
public DateTime? ModifyDate { get; set; }      // ✅ Audit field
public string ModifiedBy { get; set; }         // ✅ Audit field
public bool IsActive { get; set; }             // ✅ Status flag
public bool NeedsPendingEmail { get; set; }    // ✅ Internal flag
public bool IsDeleted { get; set; }            // ✅ Soft delete
public DateTime? DeletedAt { get; set; }       // ✅ Audit field
public string? DeletedBy { get; set; }         // ✅ Audit field
public uint? RowVersion { get; set; }          // ✅ Concurrency token
public string? Preferences { get; set; }       // ✅ JSON blob, user-controlled
public DateTime? LastLoginAt { get; set; }     // ✅ Activity tracking
public string? LastLoginIp { get; set; }       // ⚠️ PII - IP addresses
public int FailedLoginCount { get; set; }      // ✅ Security counter
public DateTime? LockoutEndUtc { get; set; }   // ✅ Security field
```

#### UserCredential Entity (`identity.UserCredentials`)

```csharp
// Current columns - ALL PASS
public int UserId { get; set; }                // ✅ FK to User
public string PasswordHash { get; set; }       // ✅ BCrypt hash (irreversible)
public DateTime? PasswordChangedAt { get; set; } // ✅ Security tracking
public DateTime CreateDate { get; set; }       // ✅ Audit field
```

**Security Note:** Password is properly hashed using BCrypt with work factor 12 (2^12 = 4,096 iterations). This is within OWASP recommended range (10-14).

#### RefreshToken Entity (`identity.RefreshTokens`)

```csharp
// Current columns - ALL PASS
public int Id { get; set; }                    // ✅ PK
public string TokenHash { get; set; }          // ✅ SHA256 hash (never plaintext)
public Guid FamilyId { get; set; }             // ✅ Token rotation tracking
public int UserId { get; set; }                // ✅ FK to User
public DateTime ExpiresAt { get; set; }        // ✅ Expiration
public DateTime SessionStartedAt { get; set; } // ✅ Absolute timeout tracking
public DateTime CreateDate { get; set; }       // ✅ Audit
public bool IsRevoked { get; set; }            // ✅ Revocation status
public DateTime? RevokedAt { get; set; }       // ✅ Audit
public string? CreatedByIp { get; set; }       // ⚠️ PII - IP address
```

#### PasswordResetToken Entity (`identity.PasswordResetTokens`)

```csharp
// Current columns - REVIEW NEEDED
public int Id { get; set; }                    // ✅ PK
public int UserId { get; set; }                // ✅ FK to User
public string Token { get; set; }              // ⚠️ MEDIUM RISK - Plaintext token
public DateTime ExpiresAt { get; set; }        // ✅ 24-hour expiration
public DateTime CreateDate { get; set; }       // ✅ Audit
public bool IsUsed { get; set; }               // ✅ Single-use enforcement
```

#### EmailVerificationToken Entity (`identity.EmailVerificationTokens`)

```csharp
// Current columns - REVIEW NEEDED
public int Id { get; set; }                    // ✅ PK
public string Email { get; set; }              // ⚠️ Plaintext email for unverified
public string Token { get; set; }              // ⚠️ MEDIUM RISK - Plaintext token
public DateTime ExpiresAt { get; set; }        // ✅ 24-hour expiration
public DateTime CreateDate { get; set; }       // ✅ Audit
public bool IsUsed { get; set; }               // ✅ Single-use enforcement
```

---

## 2. Security Findings Summary

### 2.1 What's Working Well ✅

| Feature               | Implementation                | Security Level |
| --------------------- | ----------------------------- | -------------- |
| Password Storage      | BCrypt with work factor 12    | EXCELLENT      |
| Refresh Token Storage | SHA256 hashed                 | EXCELLENT      |
| Token Rotation        | Family-based revocation       | EXCELLENT      |
| Soft Delete           | Global query filter           | GOOD           |
| Audit Trail           | CreatedBy/ModifiedBy tracking | GOOD           |
| Account Lockout       | Configurable threshold        | GOOD           |
| Rate Limiting         | Per-endpoint limits           | GOOD           |
| Cookie Security       | HTTP-only, Secure flag        | GOOD           |
| PKCE for OAuth        | Code verifier implementation  | EXCELLENT      |
| Session Timeout       | Absolute 30-day limit         | GOOD           |

### 2.2 Areas for Improvement ⚠️

| Finding                                    | Risk   | Recommendation                   | Priority |
| ------------------------------------------ | ------ | -------------------------------- | -------- |
| Password reset tokens stored plaintext     | MEDIUM | Hash tokens before storage       | P2       |
| Email verification tokens stored plaintext | MEDIUM | Hash tokens before storage       | P2       |
| IP addresses stored plaintext              | LOW    | Acceptable for security auditing | P4       |
| Email addresses stored plaintext           | LOW    | See Section 3 analysis           | P3       |
| No explicit PII data classification        | LOW    | Add data classification comments | P4       |

---

## 3. Email Storage Analysis

### 3.1 Should Emails Be Encrypted?

**Short Answer:** No encryption required, but consider the tradeoffs.

**Analysis:**

| Storage Method          | Pros                                                    | Cons                                                               |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| **Plaintext (Current)** | Searchable by email, fast lookups, password reset works | Database breach exposes emails                                     |
| **Encrypted (AES-256)** | Protected at rest                                       | Cannot search, must decrypt to validate, key management complexity |
| **Hashed (SHA-256)**    | Cannot be reversed                                      | Cannot send emails, cannot search, unusable for communication      |

### 3.2 Recommendation

**Keep emails in plaintext** for the following reasons:

1. **Functionality Required:** Email addresses must be:

    - Searchable for duplicate detection
    - Retrievable for password reset emails
    - Displayed in user management UI (admin function)

2. **Defense in Depth Already Exists:**

    - Database should be encrypted at rest (PostgreSQL TDE or disk encryption)
    - Network traffic encrypted via TLS
    - Database access restricted via firewall rules
    - Application-level access control (admin-only for user management)

3. **GDPR Compliance:**
    - Email is considered PII but encryption is not mandated
    - Must have lawful basis for processing (consent during registration)
    - Must honor data subject access requests (DSAR)
    - Must support right to erasure (soft delete with eventual hard delete)

### 3.3 If Encryption Is Required (Future)

Add application-level encryption using ASP.NET Core Data Protection:

```csharp
// DO NOT IMPLEMENT unless compliance requirement exists
// This is for reference only - YAGNI principle

public class EncryptedEmailConverter : ValueConverter<string, string>
{
	public EncryptedEmailConverter(IDataProtector protector)
		: base(
			email => protector.Protect(email),
			encryptedEmail => protector.Unprotect(encryptedEmail))
	{
	}
}
```

**Trade-off:** Would require storing a searchable hash separately or removing email search capability.

---

## 4. Server-Side Exposed Properties

### 4.1 DTOs Analysis

#### UserDto (Admin API Response)

```csharp
public record UserDto(
	int Id,              // ✅ Safe - internal identifier
	string Username,     // ✅ Safe - non-sensitive
	string Email,        // ⚠️ PII - Admin-only endpoint, acceptable
	string? FullName,    // ⚠️ PII - Admin-only endpoint, acceptable
	DateTime CreateDate, // ✅ Safe - audit info
	bool IsActive,       // ✅ Safe - status
	bool NeedsPendingEmail, // ⚠️ REMOVE - Internal implementation detail
	string CreatedBy,    // ✅ Safe - audit info
	DateTime? ModifyDate,// ✅ Safe - audit info
	string ModifiedBy,   // ✅ Safe - audit info
	DateTime? LastLoginAt, // ✅ Safe - activity tracking
	bool IsDeleted,      // ✅ Safe - status (admin context)
	DateTime? DeletedAt, // ✅ Safe - audit info
	string? DeletedBy);  // ✅ Safe - audit info
```

**Finding:** `NeedsPendingEmail` is an internal flag that should not be exposed to clients.

#### UserProfileDto (Authenticated User Response)

```csharp
public record UserProfileDto(
	int Id,              // ✅ Safe
	string Username,     // ✅ Safe
	string Email,        // ✅ Safe - user's own email
	string? FullName,    // ✅ Safe - user's own name
	IReadOnlyList<string> Roles, // ✅ Safe - user's own roles
	bool HasPassword,    // ✅ Safe - indicates auth method
	IReadOnlyList<string> LinkedProviders, // ✅ Safe
	DateTime? LastLoginAt); // ✅ Safe
```

**Status:** ✅ PASS - No issues found

#### AuthResponse

```csharp
public record AuthResponse(
	string AccessToken,  // ✅ Safe - short-lived JWT
	DateTime ExpiresAt,  // ✅ Safe - helps client manage token
	bool RequiresPasswordChange = false); // ✅ Safe - UX flag
```

**Status:** ✅ PASS - No issues found

### 4.2 API Endpoint Authorization Review

| Endpoint                            | Authorization | Exposes        | Status  |
| ----------------------------------- | ------------- | -------------- | ------- |
| `GET /api/v1/users`                 | Admin Only    | UserDto list   | ✅ PASS |
| `GET /api/v1/users/{id}`            | Admin Only    | UserDto        | ✅ PASS |
| `PUT /api/v1/users/me`              | Authenticated | UserProfileDto | ✅ PASS |
| `POST /api/v1/auth/login`           | Anonymous     | AuthResponse   | ✅ PASS |
| `POST /api/v1/auth/register`        | Anonymous     | AuthResponse   | ✅ PASS |
| `POST /api/v1/auth/forgot-password` | Anonymous     | No user data   | ✅ PASS |

### 4.3 JWT Claims Analysis

```csharp
// Claims in access token (from TokenService.GenerateAccessToken)
new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),       // ✅ User ID
new Claim(JwtRegisteredClaimNames.UniqueName, username),         // ✅ Username
new Claim(JwtRegisteredClaimNames.Email, email),                 // ⚠️ Email in JWT
new Claim(JwtRegisteredClaimNames.GivenName, fullName ?? ""),    // ⚠️ Name in JWT
new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), // ✅ Token ID
new Claim(JwtRegisteredClaimNames.Iat, ...),                     // ✅ Issued at
new Claim(ClaimTypes.Role, roleName)                             // ✅ Roles (foreach)
```

**Finding:** Email and FullName in JWT are visible to anyone who inspects the token (base64 decoded). This is a **LOW** risk because:

-   JWTs are short-lived (configurable expiration)
-   JWTs are transmitted over HTTPS only
-   User already knows their own email/name

**Recommendation:** Consider removing email/fullName from JWT if not needed by client. Client can fetch `/me` endpoint instead.

---

## 5. Client-Side Exposed Properties

### 5.1 Angular Models Review

#### UserDto (Admin Domain)

```typescript
export type UserDto = Omit<components["schemas"]["UserDto"], "id" | "statusCode"> & {
	id: number; // ✅ Type correction only
	statusCode?: number | null;
};
```

**Status:** Mirrors server DTO - same findings apply (remove `NeedsPendingEmail`)

#### Auth Models

```typescript
export type LoginRequest = components["schemas"]["LoginRequest"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type AuthResponse = components["schemas"]["AuthResponse"];
```

**Status:** ✅ PASS - Generated from OpenAPI spec, correctly typed

### 5.2 Client Storage Review

| Data          | Storage Location          | Security                |
| ------------- | ------------------------- | ----------------------- |
| Access Token  | Memory (service variable) | ✅ Not in localStorage  |
| Refresh Token | HTTP-only cookie          | ✅ Cannot be read by JS |
| User Profile  | Service state             | ✅ In-memory only       |

---

## 6. Recommended Actions

### Priority 1 (Critical) - None Found

No critical security vulnerabilities identified.

### Priority 2 (High) - Token Hashing

**Issue:** Password reset and email verification tokens stored in plaintext.

**Risk:** If database is compromised, attacker could use unexpired tokens.

**Mitigation:** Hash tokens before storage (same pattern as RefreshToken).

```csharp
// PasswordResetToken entity change
public string TokenHash { get; set; } = string.Empty; // Was: Token

// Lookup pattern
string tokenHash =
	CryptoExtensions.ComputeSha256Hash(providedToken);

PasswordResetToken? resetToken =
	await repository.GetByTokenHashAsync(tokenHash);
```

**Effort:** 4-8 hours
**Files Affected:**

-   `PasswordResetToken.cs`
-   `PasswordResetTokenConfiguration.cs`
-   `EmailVerificationToken.cs`
-   `EmailVerificationTokenConfiguration.cs`
-   Related command handlers
-   Migration file

### Priority 3 (Medium) - DTO Cleanup

**Issue:** `NeedsPendingEmail` exposed in UserDto.

**Fix:** Remove from DTO or create separate admin-internal DTO.

```csharp
// Remove NeedsPendingEmail from UserDto
public record UserDto(
	int Id,
	string Username,
	string Email,
	string? FullName,
	DateTime CreateDate,
	bool IsActive,
	// REMOVED: bool NeedsPendingEmail,
	string CreatedBy,
	DateTime? ModifyDate,
	string ModifiedBy,
	DateTime? LastLoginAt,
	bool IsDeleted,
	DateTime? DeletedAt,
	string? DeletedBy);
```

**Effort:** 1-2 hours
**Files Affected:**

-   `UserDto.cs`
-   `UserExtensions.cs` (mapping)
-   Client models (regenerate OpenAPI types)

### Priority 4 (Low) - Documentation

**Issue:** No explicit PII classification in code comments.

**Fix:** Add XML documentation comments indicating PII status.

```csharp
/// <summary>
/// Gets or sets the user's email address.
/// </summary>
/// <remarks>
/// PII Classification: Personal Data (GDPR Article 4)
/// Retention: Retained until account deletion + 30 days
/// </remarks>
public string Email { get; set; } = string.Empty;
```

**Effort:** 2-4 hours
**Files Affected:** All Identity entities

---

## 7. Implementation Tasks

### Task 1: Hash Password Reset Tokens

**Status:** Not Started
**Estimate:** 4 hours
**Dependencies:** None

```
Files to modify:
├── Entities/PasswordResetToken.cs
│   └── Rename Token → TokenHash
├── Configurations/PasswordResetTokenConfiguration.cs
│   └── Update column mapping
├── Commands/ForgotPassword/ForgotPasswordCommandHandler.cs
│   └── Hash token before save
├── Commands/SetPassword/SetPasswordCommandHandler.cs
│   └── Hash incoming token for lookup
└── Migrations/
    └── Add migration for column rename
```

### Task 2: Hash Email Verification Tokens

**Status:** Not Started
**Estimate:** 4 hours
**Dependencies:** Task 1 (use same pattern)

```
Files to modify:
├── Entities/EmailVerificationToken.cs
│   └── Rename Token → TokenHash
├── Configurations/EmailVerificationTokenConfiguration.cs
│   └── Update column mapping
├── Commands/InitiateRegistration/InitiateRegistrationCommandHandler.cs
│   └── Hash token before save
├── Commands/CompleteRegistration/CompleteRegistrationCommandHandler.cs
│   └── Hash incoming token for lookup
└── Migrations/
    └── Add migration for column rename
```

### Task 3: Remove NeedsPendingEmail from UserDto

**Status:** Not Started
**Estimate:** 1 hour
**Dependencies:** None

```
Files to modify:
├── DTOs/UserDto.cs
│   └── Remove NeedsPendingEmail property
├── Extensions/UserExtensions.cs
│   └── Remove from ToDto() mapping
└── Client (regenerate)
    └── npm run generate:api
```

### Task 4: Add PII Documentation Comments

**Status:** Not Started
**Estimate:** 2 hours
**Dependencies:** None

```
Files to modify:
├── Entities/User.cs
├── Entities/RefreshToken.cs
├── Entities/EmailVerificationToken.cs
└── DTOs/UserDto.cs
```

---

## 8. Testing Strategy

### 8.1 80/20 Rule Application

Focus testing on:

1. **Token hashing** - Security-critical, must work correctly
2. **Login/logout flows** - Core functionality
3. **Authorization boundaries** - Admin-only endpoints

Skip exhaustive tests for:

-   Every field in every DTO (trust generated types)
-   Happy-path variations (one test per scenario)
-   UI-level validation (tested in E2E)

### 8.2 Required Tests for Token Hashing

```csharp
// Tests/SeventySix.Domains.Tests/Identity/Commands/

[Fact]
public async Task ForgotPassword_ShouldStoreHashedTokenAsync()
{
	// Arrange
	string testEmail = "test@example.com";

	// Act
	await handler.HandleAsync(new ForgotPasswordCommand(testEmail));

	// Assert
	PasswordResetToken? resetToken =
		await context.PasswordResetTokens.FirstOrDefaultAsync();

	resetToken.ShouldNotBeNull();
	resetToken.TokenHash.ShouldNotBeNullOrEmpty();
	resetToken.TokenHash.Length.ShouldBe(64); // SHA256 hex length
}

[Fact]
public async Task SetPassword_ShouldValidateHashedTokenAsync()
{
	// Arrange
	string rawToken = "base64-encoded-random-token";
	string hashedToken =
		CryptoExtensions.ComputeSha256Hash(rawToken);

	PasswordResetToken resetToken =
		new()
		{
			TokenHash = hashedToken,
			ExpiresAt = DateTime.UtcNow.AddHours(24),
			IsUsed = false
		};

	await context.PasswordResetTokens.AddAsync(resetToken);
	await context.SaveChangesAsync();

	// Act
	SetPasswordResult passwordResult =
		await handler.HandleAsync(
			new SetPasswordCommand(
				rawToken,
				"NewPassword123!"));

	// Assert
	passwordResult.Success.ShouldBeTrue();
}
```

### 8.3 Test Coverage Targets

| Area                  | Coverage Target | Rationale                       |
| --------------------- | --------------- | ------------------------------- |
| Token hashing logic   | 100%            | Security-critical               |
| Auth command handlers | 80%             | Core business logic             |
| Entity configurations | 50%             | EF migration handles much       |
| DTOs                  | 0%              | Record types, compiler-verified |
| Extension methods     | 60%             | Simple mappings                 |

---

## Appendix A: Security Checklist

### A.1 OWASP Top 10 Compliance

| #   | Vulnerability             | Status  | Implementation                |
| --- | ------------------------- | ------- | ----------------------------- |
| A01 | Broken Access Control     | ✅ PASS | Policy-based authorization    |
| A02 | Cryptographic Failures    | ⚠️ P2   | Token hashing needed          |
| A03 | Injection                 | ✅ PASS | EF Core parameterized queries |
| A04 | Insecure Design           | ✅ PASS | Defense in depth              |
| A05 | Security Misconfiguration | ✅ PASS | Secure defaults               |
| A06 | Vulnerable Components     | ✅ PASS | Regular updates               |
| A07 | Auth Failures             | ✅ PASS | Lockout, rate limiting        |
| A08 | Data Integrity Failures   | ✅ PASS | JWT signature validation      |
| A09 | Security Logging          | ✅ PASS | Structured logging            |
| A10 | SSRF                      | N/A     | No external URL fetching      |

### A.2 Final Verdict

**Overall Security Status: GOOD**

The Identity domain follows security best practices with room for improvement in token storage. The implementation demonstrates:

-   ✅ Proper password hashing (BCrypt)
-   ✅ Refresh token rotation with reuse detection
-   ✅ Account lockout protection
-   ✅ Rate limiting on auth endpoints
-   ✅ HTTP-only secure cookies
-   ✅ PKCE for OAuth flows
-   ✅ Soft delete with audit trail
-   ⚠️ Password reset tokens need hashing (P2)
-   ⚠️ Minor DTO cleanup needed (P3)

---

## Appendix B: Code Quality Guidelines

### B.1 Variable Naming (CRITICAL)

All code in this implementation **MUST** follow the SeventySix naming conventions:

| Context          | ❌ NEVER                   | ✅ ALWAYS                                           |
| ---------------- | -------------------------- | --------------------------------------------------- |
| C# Lambdas       | `x => x.Id`, `t => t.Hash` | `user => user.Id`, `token => token.Hash`            |
| LINQ Queries     | `.Where(r => r.IsUsed)`    | `.Where(resetToken => resetToken.IsUsed)`           |
| Async Results    | `var result = await ...`   | `SetPasswordResult passwordResult = await ...`      |
| Loop Variables   | `for (int i = 0; ...)`     | `foreach` OR `for (int index = 0; ...)`             |
| Entity Variables | `token`, `t`, `e`          | `resetToken`, `verificationToken`, `userCredential` |

### B.2 Formatting Requirements

All C# code must follow these formatting rules:

```csharp
// ✅ CORRECT: Assignment on new line
PasswordResetToken? resetToken =
	await repository.GetByTokenHashAsync(tokenHash);

// ✅ CORRECT: Multi-parameter on separate lines
SetPasswordResult passwordResult =
	await handler.HandleAsync(
		new SetPasswordCommand(
			rawToken,
			newPassword));

// ✅ CORRECT: Fluent chains with . on new line
builder
	.Property(resetToken => resetToken.TokenHash)
	.IsRequired()
	.HasMaxLength(64);

// ❌ WRONG: Single-letter lambda parameter
builder.Property(t => t.TokenHash); // VIOLATION!

// ❌ WRONG: Assignment on same line
var token = await repository.GetByTokenHashAsync(hash);
```

### B.3 Code Smells to Avoid

| Smell              | Example                    | Fix                                     |
| ------------------ | -------------------------- | --------------------------------------- |
| Single-letter vars | `x`, `t`, `e`, `r`         | Use descriptive names                   |
| Abbreviations      | `pwd`, `usr`, `tkn`        | `password`, `user`, `token`             |
| Magic numbers      | `ExpiresAt.AddHours(24)`   | Use constants: `TOKEN_EXPIRATION_HOURS` |
| `var` keyword      | `var user = GetUser()`     | `User? user = GetUser()`                |
| Inline assignments | `string hash = Compute(x)` | New line after `=`                      |

### B.4 DRY Opportunities Identified

| Area                       | Current State            | DRY Improvement                            |
| -------------------------- | ------------------------ | ------------------------------------------ |
| Token hashing              | Would be duplicated      | Create shared `IHashableToken` interface   |
| Token validation           | Copy-paste between flows | Extract `ValidateTokenAsync<T>` generic    |
| SHA256 computation         | Already shared           | `CryptoExtensions.ComputeSha256Hash` ✅    |
| Token expiration constants | Hardcoded in handlers    | Move to `AuthSettings.Token` configuration |

#### Recommended Interface for Token Hashing (DRY)

```csharp
/// <summary>
/// Marker interface for entities that store hashed tokens.
/// Enables generic token validation logic.
/// </summary>
public interface IHashableToken
{
	string TokenHash { get; set; }
	DateTime ExpiresAt { get; }
	bool IsUsed { get; set; }
}

// Both entities implement this interface
public class PasswordResetToken : ICreatableEntity, IHashableToken { ... }
public class EmailVerificationToken : ICreatableEntity, IHashableToken { ... }
```

---

## Appendix C: TDD Implementation Order

### C.1 Test-First Development Sequence

Execute tasks in this order, writing failing tests first:

```
1. Write failing test for PasswordResetToken hash storage
2. Implement PasswordResetToken.TokenHash property
3. Run test → should fail (migration needed)
4. Create EF migration
5. Run test → should pass
6. Refactor if needed
7. Repeat for EmailVerificationToken
```

### C.2 Test File Organization

```
Tests/SeventySix.Domains.Tests/Identity/
├── Commands/
│   ├── ForgotPassword/
│   │   └── ForgotPasswordCommandHandlerTests.cs
│   ├── SetPassword/
│   │   └── SetPasswordCommandHandlerTests.cs
│   ├── InitiateRegistration/
│   │   └── InitiateRegistrationCommandHandlerTests.cs
│   └── CompleteRegistration/
│       └── CompleteRegistrationCommandHandlerTests.cs
├── Entities/
│   ├── PasswordResetTokenTests.cs
│   └── EmailVerificationTokenTests.cs
└── Services/
    └── TokenHashingServiceTests.cs (if extracted)
```

### C.3 Test Naming Convention

```csharp
// Pattern: {Method}_Should{ExpectedBehavior}Async

[Fact]
public async Task HandleAsync_ShouldStoreHashedToken_WhenValidEmailProvidedAsync()

[Fact]
public async Task HandleAsync_ShouldRejectExpiredTokenAsync()

[Fact]
public async Task HandleAsync_ShouldRejectUsedTokenAsync()
```

---

## Revision History

| Version | Date       | Author         | Changes                                                      |
| ------- | ---------- | -------------- | ------------------------------------------------------------ |
| 1.0     | 2025-12-15 | Security Audit | Initial comprehensive audit                                  |
| 1.1     | 2025-12-15 | Code Review    | Added Appendix B (Code Quality) and C (TDD), fixed var names |

## Revision History

| Version | Date       | Author         | Changes                     |
| ------- | ---------- | -------------- | --------------------------- |
| 1.0     | 2025-12-15 | Security Audit | Initial comprehensive audit |
