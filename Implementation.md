# Implementation Plan: Registration Flow & Theme Fixes

## Overview

This plan addresses three critical issues:

1. **Account Creation Flow** - Email field not passed during registration completion
2. **Button Styling Issues** - Replace custom CSS buttons with Material flat buttons
3. **Default Theme** - Change default color scheme from Blue to Cyan-Orange

---

## Issue 1: Account Creation Email Field Missing

### Problem Statement

When a user clicks the email verification link and attempts to complete registration, the API returns:

```json
{
	"type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
	"title": "One or more validation errors occurred.",
	"status": 400,
	"errors": {
		"Email": ["The Email field is required."]
	}
}
```

### Root Cause Analysis

| Component                                                                                                            | Issue                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [CompleteRegistrationRequest.cs](SeventySix.Server/SeventySix.Domains/Identity/DTOs/CompleteRegistrationRequest.cs)  | Requires `Email` field: `record CompleteRegistrationRequest(string Email, string Token, string Username, string Password)` |
| [auth.service.ts](SeventySix.Client/src/app/shared/services/auth.service.ts#L358-L368)                               | Sends only `{ token, username, password }` - **missing `email`**                                                           |
| [EmailService.cs](SeventySix.Server/SeventySix.Domains/ElectronicNotifications/Emails/Services/EmailService.cs#L173) | Verification URL only contains token: `?token={verificationToken}`                                                         |
| [register-complete.ts](SeventySix.Client/src/app/domains/auth/pages/register-complete/register-complete.ts#L130)     | Only extracts `token` from query params                                                                                    |

### Solution Architecture

**Option A: Embed email in token (Recommended - More Secure)**

The combined token approach encodes email + verification token together, preventing email enumeration attacks.

**Option B: Pass email as separate query parameter (Simpler but Less Secure)**

Add `&email={email}` to URL - exposes email in URL history/logs.

**Decision: Option A - Combined Token**

### Implementation Steps

#### Phase 1: Server-Side Token Enhancement

##### 1.1 Create Combined Token Model

**File:** `SeventySix.Server/SeventySix.Domains/Identity/DTOs/CombinedRegistrationToken.cs`

```csharp
// <copyright file="CombinedRegistrationToken.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Combined token containing email and verification token for secure registration.
/// </summary>
/// <param name="Email">
/// The email address being verified.
/// </param>
/// <param name="Token">
/// The Identity email confirmation token.
/// </param>
public record CombinedRegistrationToken(
	string Email,
	string Token);
```

##### 1.2 Create Token Encoding Service

**File:** `SeventySix.Server/SeventySix.Domains/Identity/Services/RegistrationTokenService.cs`

```csharp
// <copyright file="RegistrationTokenService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;

namespace SeventySix.Identity;

/// <summary>
/// Service for encoding and decoding combined registration tokens.
/// </summary>
public static class RegistrationTokenService
{
	/// <summary>
	/// Encodes email and token into a single URL-safe string.
	/// </summary>
	/// <param name="email">
	/// User email address.
	/// </param>
	/// <param name="verificationToken">
	/// Identity email confirmation token.
	/// </param>
	/// <returns>
	/// Base64 URL-encoded combined token.
	/// </returns>
	public static string Encode(
		string email,
		string verificationToken)
	{
		CombinedRegistrationToken combinedToken =
			new(email, verificationToken);

		string jsonPayload =
			JsonSerializer.Serialize(combinedToken);

		byte[] payloadBytes =
			Encoding.UTF8.GetBytes(jsonPayload);

		return WebEncoders.Base64UrlEncode(payloadBytes);
	}

	/// <summary>
	/// Decodes a combined token back to email and verification token.
	/// </summary>
	/// <param name="encodedToken">
	/// The Base64 URL-encoded combined token.
	/// </param>
	/// <returns>
	/// Decoded token or null if invalid.
	/// </returns>
	public static CombinedRegistrationToken? Decode(string encodedToken)
	{
		try
		{
			byte[] decodedBytes =
				WebEncoders.Base64UrlDecode(encodedToken);

			string jsonPayload =
				Encoding.UTF8.GetString(decodedBytes);

			return JsonSerializer.Deserialize<CombinedRegistrationToken>(jsonPayload);
		}
		catch
		{
			return null;
		}
	}
}
```

##### 1.3 Update EmailService to Use Combined Token

**File:** [EmailService.cs](SeventySix.Server/SeventySix.Domains/ElectronicNotifications/Emails/Services/EmailService.cs#L173)

```csharp
// BEFORE
private string BuildEmailVerificationUrl(string verificationToken) =>
	$"{settings.Value.ClientBaseUrl}/auth/register/complete?token={Uri.EscapeDataString(verificationToken)}";

// AFTER
private string BuildEmailVerificationUrl(
	string email,
	string verificationToken)
{
	string combinedToken =
		RegistrationTokenService.Encode(
			email,
			verificationToken);

	return $"{settings.Value.ClientBaseUrl}/auth/register/complete?token={Uri.EscapeDataString(combinedToken)}";
}
```

Update `SendVerificationEmailAsync` to pass email:

```csharp
public async Task SendVerificationEmailAsync(
	string recipientEmail,
	string verificationToken,
	CancellationToken cancellationToken)
{
	string verificationUrl =
		BuildEmailVerificationUrl(
			recipientEmail,
			verificationToken);
	// ... rest of method
}
```

##### 1.4 Update CompleteRegistrationRequest

**File:** [CompleteRegistrationRequest.cs](SeventySix.Server/SeventySix.Domains/Identity/DTOs/CompleteRegistrationRequest.cs)

```csharp
// BEFORE
public record CompleteRegistrationRequest(
	string Email,
	string Token,
	string Username,
	string Password);

// AFTER - Remove Email parameter (extracted from combined token)
public record CompleteRegistrationRequest(
	string Token,
	string Username,
	string Password);
```

##### 1.5 Update CompleteRegistrationCommandValidator

**File:** [CompleteRegistrationCommandValidator.cs](SeventySix.Server/SeventySix.Domains/Identity/Commands/CompleteRegistration/CompleteRegistrationCommandValidator.cs)

```csharp
public CompleteRegistrationCommandValidator()
{
	RuleFor(request => request.Token)
		.NotEmpty()
		.WithMessage("Verification token is required.");

	RuleFor(request => request.Username).ApplyUsernameRules();

	RuleFor(request => request.Password).ApplyPasswordRules();
}
```

##### 1.6 Update CompleteRegistrationCommandHandler

**File:** [CompleteRegistrationCommandHandler.cs](SeventySix.Server/SeventySix.Domains/Identity/Commands/CompleteRegistration/CompleteRegistrationCommandHandler.cs#L59-L75)

Decode combined token at handler start:

```csharp
public static async Task<AuthResult> HandleAsync(
	CompleteRegistrationCommand command,
	UserManager<ApplicationUser> userManager,
	AuthenticationService authenticationService,
	TimeProvider timeProvider,
	ILogger<CompleteRegistrationCommand> logger,
	CancellationToken cancellationToken)
{
	// Decode combined token
	CombinedRegistrationToken? decodedToken =
		RegistrationTokenService.Decode(command.Request.Token);

	if (decodedToken is null)
	{
		logger.LogWarning("Invalid combined registration token format");

		return AuthResult.Failed(
			"Invalid or expired verification link.",
			AuthErrorCodes.InvalidToken);
	}

	// Find the user by email from the decoded token
	ApplicationUser? existingUser =
		await userManager.FindByEmailAsync(decodedToken.Email);

	if (existingUser is null)
	{
		logger.LogWarning(
			"Attempted to complete registration for non-existent email: {Email}",
			decodedToken.Email);

		return AuthResult.Failed(
			"Invalid or expired verification link.",
			AuthErrorCodes.InvalidToken);
	}

	// Verify the email confirmation token using Identity's token provider
	IdentityResult confirmResult =
		await userManager.ConfirmEmailAsync(
			existingUser,
			decodedToken.Token);

	// ... rest of handler unchanged
}
```

#### Phase 2: Client-Side Updates

##### 2.1 Update AuthService

**File:** [auth.service.ts](SeventySix.Client/src/app/shared/services/auth.service.ts#L358-L368)

No changes needed - the combined token is transparent to the client. The same `token` parameter is sent, but now contains encoded email.

##### 2.2 Update RegisterCompleteComponent

**File:** [register-complete.ts](SeventySix.Client/src/app/domains/auth/pages/register-complete/register-complete.ts)

No changes required - component already reads `token` from query params correctly.

#### Phase 3: Update Tests

##### 3.1 Server Tests

**File:** `Tests/SeventySix.Domains.Tests/Identity/Services/RegistrationTokenServiceTests.cs`

```csharp
public class RegistrationTokenServiceTests
{
	[Fact]
	public void Encode_WithValidInputs_ReturnsUrlSafeString()
	{
		// Arrange
		string testEmail =
			"test@example.com";
		string verificationToken =
			"verification-token-123";

		// Act
		string encodedToken =
			RegistrationTokenService.Encode(
				testEmail,
				verificationToken);

		// Assert
		encodedToken.ShouldNotBeNullOrWhiteSpace();
		encodedToken.ShouldNotContain("+");
		encodedToken.ShouldNotContain("/");
		encodedToken.ShouldNotContain("=");
	}

	[Fact]
	public void Decode_WithValidToken_ReturnsOriginalValues()
	{
		// Arrange
		string testEmail =
			"test@example.com";
		string verificationToken =
			"verification-token-123";

		string encodedToken =
			RegistrationTokenService.Encode(
				testEmail,
				verificationToken);

		// Act
		CombinedRegistrationToken? decodedToken =
			RegistrationTokenService.Decode(encodedToken);

		// Assert
		decodedToken.ShouldNotBeNull();
		decodedToken.Email.ShouldBe(testEmail);
		decodedToken.Token.ShouldBe(verificationToken);
	}

	[Fact]
	public void Decode_WithInvalidToken_ReturnsNull()
	{
		// Arrange
		string invalidToken =
			"not-a-valid-base64-token";

		// Act
		CombinedRegistrationToken? decodedToken =
			RegistrationTokenService.Decode(invalidToken);

		// Assert
		decodedToken.ShouldBeNull();
	}
}
```

##### 3.2 Update Existing Handler Tests

**File:** [CompleteRegistrationCommandHandlerTests.cs](SeventySix.Server/Tests/SeventySix.Domains.Tests/Identity/Commands/CompleteRegistration/CompleteRegistrationCommandHandlerTests.cs)

Update test data to use combined tokens via `RegistrationTokenService.Encode()`.

---

## Issue 2: Button Styling - Use Material Flat Buttons

### Problem Statement

Auth pages use custom CSS buttons (`.btn-primary`, `.btn-github`) instead of Angular Material buttons. This causes:

1. Inconsistent styling with the rest of the application
2. Poor contrast in certain theme combinations
3. Green tertiary color bleeding into hover states

### Solution Architecture

**Replace custom CSS buttons with Angular Material `mat-flat-button`** per the Style Guide which shows:

-   `mat-raised-button` - High emphasis (3D shadow)
-   `mat-flat-button` - Medium emphasis (flat, filled background) ← **Use this**
-   `mat-stroked-button` - Medium emphasis (outlined)

### Implementation Steps

#### Phase 1: Fix Material Theme Tertiary Palette

##### 1.1 Replace Green Tertiary with Violet

**File:** [\_material-theme.scss](SeventySix.Client/src/app/shared/styles/_material-theme.scss#L14-L41)

```scss
// BEFORE
$light-blue-theme: mat.define-theme(
	(
		color: (
			theme-type: light,
			primary: mat.$blue-palette,
			tertiary: mat.$green-palette,
		),
		typography: (
			brand-family: "Roboto",
			plain-family: "Roboto",
		),
		density: (
			scale: -1,
		),
	)
);

// AFTER
$light-blue-theme: mat.define-theme(
	(
		color: (
			theme-type: light,
			primary: mat.$blue-palette,
			tertiary: mat.$violet-palette,
		),
		typography: (
			brand-family: "Roboto",
			plain-family: "Roboto",
		),
		density: (
			scale: -1,
		),
	)
);
```

Apply same change to `$dark-blue-theme` (lines 28-41).

#### Phase 2: Convert Auth Pages to Material Buttons

##### 2.1 Update Login Page

**File:** [login.ts](SeventySix.Client/src/app/domains/auth/pages/login/login.ts)

Add Material imports:

```typescript
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component(
	{
		selector: "app-login",
		standalone: true,
		imports: [
			FormsModule,
			RouterLink,
			MatButtonModule,
			MatIconModule
		],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./login.html",
		styleUrl: "./login.scss"
	})
```

**File:** [login.html](SeventySix.Client/src/app/domains/auth/pages/login/login.html)

```html
<!-- BEFORE -->
<button type="button" class="btn-oauth btn-github" [disabled]="isLoading()" (click)="onGitHubLogin()">
	<svg class="icon" viewBox="0 0 24 24">...</svg>
	Continue with GitHub
</button>

<button type="submit" class="btn-primary" [disabled]="isLoading()">@if (isLoading()) { Signing in... } @else { Sign In }</button>

<!-- AFTER - Material flat buttons -->
<button mat-flat-button type="button" class="oauth-button github-button" [disabled]="isLoading()" (click)="onGitHubLogin()">
	<mat-icon svgIcon="github"></mat-icon>
	Continue with GitHub
</button>

<button mat-flat-button color="primary" type="submit" class="submit-button" [disabled]="isLoading()">@if (isLoading()) { Signing in... } @else { Sign In }</button>
```

**File:** [login.scss](SeventySix.Client/src/app/domains/auth/pages/login/login.scss)

Remove custom `.btn-primary` and `.btn-github` styles. Add minimal layout styles:

```scss
@use "../../shared/styles/variables" as vars;

// ... container and form styles remain unchanged ...

// OAuth section
.oauth-buttons {
	display: flex;
	flex-direction: column;
	gap: vars.$spacing-md;
}

// GitHub OAuth button - flat style with brand color
.github-button {
	--mdc-filled-button-container-color: #24292f;
	--mdc-filled-button-label-text-color: #fff;

	&:hover:not(:disabled) {
		--mdc-filled-button-container-color: #32383f;
	}
}

// Submit button - full width
.submit-button {
	width: 100%;
}
```

##### 2.2 Update Register Email Page

**File:** [register-email.ts](SeventySix.Client/src/app/domains/auth/pages/register-email/register-email.ts)

Add Material imports:

```typescript
import { MatButtonModule } from "@angular/material/button";

@Component(
	{
		selector: "app-register-email",
		standalone: true,
		imports: [
			FormsModule,
			RouterLink,
			MatButtonModule
		],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./register-email.html",
		styleUrl: "./register-email.scss"
	})
```

**File:** [register-email.html](SeventySix.Client/src/app/domains/auth/pages/register-email/register-email.html)

```html
<!-- BEFORE -->
<button type="submit" class="btn-primary" [disabled]="isLoading() || !email.trim()">@if (isLoading()) { Sending... } @else { Continue }</button>

<a routerLink="/auth/login" class="btn-primary"> Return to Sign In </a>

<!-- AFTER -->
<button mat-flat-button color="primary" type="submit" class="submit-button" [disabled]="isLoading() || !email.trim()">@if (isLoading()) { Sending... } @else { Continue }</button>

<a mat-flat-button color="primary" routerLink="/auth/login" class="submit-button"> Return to Sign In </a>
```

**File:** [register-email.scss](SeventySix.Client/src/app/domains/auth/pages/register-email/register-email.scss)

Remove custom `.btn-primary` styles. Keep:

```scss
@use "../../shared/styles/variables" as vars;

// ... container and form styles remain unchanged ...

.submit-button {
	width: 100%;
}
```

##### 2.3 Update Register Complete Page

**File:** [register-complete.ts](SeventySix.Client/src/app/domains/auth/pages/register-complete/register-complete.ts)

Add Material imports:

```typescript
import { MatButtonModule } from "@angular/material/button";

@Component(
	{
		selector: "app-register-complete",
		standalone: true,
		imports: [
			FormsModule,
			RouterLink,
			MatButtonModule
		],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./register-complete.html",
		styleUrl: "./register-complete.scss"
	})
```

**File:** [register-complete.html](SeventySix.Client/src/app/domains/auth/pages/register-complete/register-complete.html)

```html
<!-- BEFORE -->
<a routerLink="/auth/register" class="btn-primary"> Request New Link </a>

<button type="submit" class="btn-primary" [disabled]="...">@if (isLoading()) { Creating Account... } @else { Create Account }</button>

<!-- AFTER -->
<a mat-flat-button color="primary" routerLink="/auth/register" class="submit-button"> Request New Link </a>

<button mat-flat-button color="primary" type="submit" class="submit-button" [disabled]="...">@if (isLoading()) { Creating Account... } @else { Create Account }</button>
```

##### 2.4 Update Remaining Auth Pages

Apply same pattern to:

-   [forgot-password.ts](SeventySix.Client/src/app/domains/auth/pages/forgot-password/forgot-password.ts) / `.html` / `.scss`
-   [set-password.ts](SeventySix.Client/src/app/domains/auth/pages/set-password/set-password.ts) / `.html` / `.scss`
-   [change-password.ts](SeventySix.Client/src/app/domains/auth/pages/change-password/change-password.ts) / `.html` / `.scss`

**Pattern for each:**

1. Add `MatButtonModule` to imports
2. Replace `class="btn-primary"` buttons with `mat-flat-button color="primary"`
3. Remove custom `.btn-primary` from SCSS
4. Add `.submit-button { width: 100%; }` for full-width buttons

---

## Issue 3: Default Theme to Cyan-Orange

### Problem Statement

Site currently defaults to Blue theme. Requirement is to default to Cyan-Orange.

### Root Cause Analysis

**File:** [theme.service.ts](SeventySix.Client/src/app/shared/services/theme.service.ts#L156-L162)

```typescript
private getInitialColorScheme(): ColorScheme
{
	const saved: string | null =
		this.storage.getItem<string>(
			this.SCHEME_STORAGE_KEY);
	return saved === "cyan-orange" ? "cyan-orange" : "blue";  // ❌ Defaults to blue
}
```

### Solution

##### 3.1 Update Default Color Scheme

**File:** [theme.service.ts](SeventySix.Client/src/app/shared/services/theme.service.ts#L156-L162)

```typescript
// BEFORE
private getInitialColorScheme(): ColorScheme
{
	const saved: string | null =
		this.storage.getItem<string>(
			this.SCHEME_STORAGE_KEY);
	return saved === "cyan-orange" ? "cyan-orange" : "blue";
}

// AFTER - Default to cyan-orange
private getInitialColorScheme(): ColorScheme
{
	const savedScheme: string | null =
		this.storage.getItem<string>(
			this.SCHEME_STORAGE_KEY);
	return savedScheme === "blue" ? "blue" : "cyan-orange";
}
```

##### 3.2 Update Fallback Theme in Global Styles

**File:** [styles.scss](SeventySix.Client/src/styles.scss#L92-L96)

```scss
// BEFORE
html:not(.light-theme):not(.dark-theme) {
	@include theme.apply-light-blue-theme;
	background-color: var(--mat-sys-surface);
	color: var(--mat-sys-on-surface);
}

// AFTER - Default to cyan-orange
html:not(.light-theme):not(.dark-theme) {
	@include theme.apply-light-cyan-orange-theme;
	background-color: var(--mat-sys-surface);
	color: var(--mat-sys-on-surface);
}
```

##### 3.3 Update Theme Service Tests

**File:** [theme.service.spec.ts](SeventySix.Client/src/app/shared/services/theme.service.spec.ts)

Update test expectations for default theme:

```typescript
it("should default to cyan-orange when no saved preference", () => {
	// Arrange
	mockStorage.getItem.and.returnValue(null);

	// Act
	const service: ThemeService = TestBed.inject(ThemeService);

	// Assert
	expect(service.colorScheme()).toBe("cyan-orange");
});
```

##### 3.4 Update Documentation Comments

**File:** [styles.scss](SeventySix.Client/src/styles.scss#L4-L5)

```scss
// BEFORE
// Material Design 3 theme with blue primary color

// AFTER
// Material Design 3 theme with cyan-orange primary color (default)
```

---

## Testing Strategy (80/20 Rule)

### Critical Path Tests Only

| Area                                          | Test Type       | Priority |
| --------------------------------------------- | --------------- | -------- |
| Registration Token Encoding/Decoding          | Unit            | High     |
| Complete Registration Handler (invalid token) | Unit            | High     |
| Complete Registration Handler (valid flow)    | Integration     | High     |
| Theme Service Default Scheme                  | Unit            | Medium   |
| Button Styling                                | Visual (Manual) | Medium   |

### Tests NOT Needed

-   Individual auth page component tests (UI only, covered by E2E)
-   Exhaustive edge cases for token encoding
-   E2E tests for full registration flow (manual QA sufficient)

---

## Implementation Order

### Sprint 1: Issue 1 - Registration Flow (Critical - Blocking Users)

1. Create `RegistrationTokenService` with unit tests (TDD)
2. Update `EmailService.BuildEmailVerificationUrl` signature
3. Update `CompleteRegistrationRequest` (remove Email parameter)
4. Update `CompleteRegistrationCommandHandler` to decode token
5. Update existing handler tests with combined tokens
6. Regenerate OpenAPI spec

### Sprint 2: Issue 3 - Default Theme (Quick Win)

1. Update `ThemeService.getInitialColorScheme()`
2. Update `styles.scss` fallback
3. Update theme service tests
4. Update documentation comments

### Sprint 3: Issue 2 - Material Buttons (Styling)

1. Update `_material-theme.scss` tertiary palette (green → violet)
2. Update login page to use `mat-flat-button`
3. Update register-email page to use `mat-flat-button`
4. Update register-complete page to use `mat-flat-button`
5. Update forgot-password, set-password, change-password pages
6. Remove unused custom button CSS
7. Manual visual QA across all 4 themes

---

## Files Changed Summary

### New Files

| File                                            | Purpose                 |
| ----------------------------------------------- | ----------------------- |
| `Identity/DTOs/CombinedRegistrationToken.cs`    | Combined token model    |
| `Identity/Services/RegistrationTokenService.cs` | Token encoding/decoding |
| `Tests/.../RegistrationTokenServiceTests.cs`    | Token service tests     |

### Modified Files

| File                                      | Changes                                      |
| ----------------------------------------- | -------------------------------------------- |
| `EmailService.cs`                         | Update `BuildEmailVerificationUrl` signature |
| `CompleteRegistrationRequest.cs`          | Remove `Email` parameter                     |
| `CompleteRegistrationCommandValidator.cs` | Remove Email validation rule                 |
| `CompleteRegistrationCommandHandler.cs`   | Decode combined token at start               |
| `theme.service.ts`                        | Change default to cyan-orange                |
| `styles.scss`                             | Update fallback theme + comments             |
| `_material-theme.scss`                    | Change tertiary palette (green → violet)     |
| `login.ts`                                | Add `MatButtonModule` import                 |
| `login.html`                              | Use `mat-flat-button` instead of CSS classes |
| `login.scss`                              | Remove `.btn-primary`, minimal button layout |
| `register-email.ts`                       | Add `MatButtonModule` import                 |
| `register-email.html`                     | Use `mat-flat-button`                        |
| `register-email.scss`                     | Remove `.btn-primary`                        |
| `register-complete.ts`                    | Add `MatButtonModule` import                 |
| `register-complete.html`                  | Use `mat-flat-button`                        |
| `register-complete.scss`                  | Remove `.btn-primary`                        |
| `forgot-password.ts`                      | Add `MatButtonModule` import                 |
| `forgot-password.html`                    | Use `mat-flat-button`                        |
| `forgot-password.scss`                    | Remove `.btn-primary`                        |
| `set-password.ts`                         | Add `MatButtonModule` import                 |
| `set-password.html`                       | Use `mat-flat-button`                        |
| `set-password.scss`                       | Remove `.btn-primary`                        |
| `change-password.ts`                      | Add `MatButtonModule` import                 |
| `change-password.html`                    | Use `mat-flat-button`                        |
| `change-password.scss`                    | Remove `.btn-primary`                        |

### Deleted Styles (DRY Cleanup)

Removed duplicated `.btn-primary` definitions from 6 auth page SCSS files - replaced with Material button styling.

---

## Risks & Mitigations

| Risk                                              | Impact | Mitigation                                            |
| ------------------------------------------------- | ------ | ----------------------------------------------------- |
| Existing users with old-format verification links | Medium | Links expire in 24h; re-send option available         |
| Theme preference lost for existing users          | Low    | Only affects new default, saved preferences preserved |
| Breaking API contract                             | High   | OpenAPI regeneration, client-server sync              |
| Material button sizing differs from custom        | Low    | Add `.submit-button { width: 100%; }` where needed    |

---

## Code Quality Checklist

### Variable Naming (Per Copilot Instructions)

-   ✅ No single/two-letter variables (`testEmail` not `e`, `encodedToken` not `t`)
-   ✅ Descriptive lambda parameters (`request => request.Token` not `r => r.Token`)
-   ✅ Full words (`verificationToken` not `vToken`, `combinedToken` not `cToken`)

### Formatting (Per .editorconfig)

-   ✅ Allman-style braces (opening brace on new line)
-   ✅ Newline after `=` in assignments
-   ✅ Multi-parameter calls on separate lines
-   ✅ Method chains with `.` on new lines
-   ✅ Tab indentation with 4-space width

### KISS/DRY/YAGNI

-   ✅ Single responsibility: `RegistrationTokenService` only handles token encoding
-   ✅ DRY: Removed 6 duplicated `.btn-primary` definitions
-   ✅ YAGNI: No shared button SCSS file needed - Material handles styling

---

## Definition of Done

-   [ ] All unit tests pass (`dotnet test`, `npm test`)
-   [ ] No TypeScript/C# compile errors
-   [ ] Registration flow works end-to-end (manual QA)
-   [ ] Buttons use `mat-flat-button` with proper theme colors
-   [ ] Site defaults to Cyan-Orange theme for new users
-   [ ] No green tertiary color visible in UI
-   [ ] OpenAPI spec regenerated
-   [ ] Code follows naming conventions (no single-letter variables)
