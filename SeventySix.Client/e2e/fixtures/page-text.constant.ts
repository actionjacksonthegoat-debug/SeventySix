// <copyright file="page-text.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Expected page text for assertions.
 * Update when UI copy changes.
 */
export const PAGE_TEXT =
	{
		/**
		 * Page headings.
		 */
		headings:
			{
				signIn: "Sign In",
				createAccount: "Create Account",
				register: "Register",
				forgotPassword: "Forgot Password",
				checkYourEmail: "Check Your Email",
				welcome: "Welcome to SeventySix",
				adminDashboard: "Admin Dashboard",
				changePassword: "Change Password",
				setNewPassword: "Set New Password",
				invalidLink: "Invalid Link",
				createNewUser: "Create New User",
				verifyYourIdentity: "Verify Your Identity",
				authenticatorCode: "Authenticator Code",
				useBackupCode: "Use Backup Code",
				setUpAuthenticatorApp: "Set Up Authenticator App",
				verifySetup: "Verify Setup",
				authenticatorEnabled: "Authenticator Enabled!",
				generateBackupCodes: "Generate Backup Codes",
				saveYourBackupCodes: "Save Your Backup Codes",
				backupCodesSaved: "Backup Codes Saved"
			},

		/**
		 * Button text patterns.
		 */
		buttons:
			{
				continueWithGithub: /Continue with GitHub/,
				sendResetLink: /Send Reset Link|Sending/,
				continue: /Continue|Sending/,
				logout: "Logout",
				verify: /Verify|Verifying/,
				changePassword: /Change Password|Changing/,
				setPassword: /Set Password|Setting Password/,
				createUser: /Create User/,
				generateCodes: "Generate Codes",
				savedMyCodes: "I've Saved My Codes"
			},

		/**
		 * Link text.
		 */
		links:
			{
				forgotPassword: "Forgot password?",
				returnToSignIn: "Return to Sign In"
			},

		/**
		 * Validation messages.
		 */
		validation:
			{
				enterUsernamePassword: "Please enter username and password",
				enterEmail: "Please enter an email address",
				validEmail: "valid email"
			},

		/**
		 * Error messages and patterns to detect application failures.
		 * Comprehensive patterns catch server errors, client errors, and UI error states.
		 */
		errors:
			{
				accessDenied: "Access Denied",
				error: "Error",
				/**
				 * Patterns that indicate server-side failures.
				 */
				serverPatterns:
					[
						"500",
						"Internal Server Error",
						"502 Bad Gateway",
						"503 Service Unavailable",
						"504 Gateway Timeout"
					] as const,
				/**
				 * Patterns that indicate client-side application errors.
				 */
				clientPatterns:
					[
						"Something went wrong",
						"An error occurred",
						"failed to load",
						"Unable to connect",
						"Network error",
						"Request failed"
					] as const,
				/**
				 * HTTP status codes that indicate errors.
				 */
				httpPatterns:
					[
						"404",
						"Not Found",
						"401",
						"Unauthorized",
						"403",
						"Forbidden"
					] as const,
				/**
				 * Angular-specific error indicators.
				 */
				angularPatterns:
					[
						"NG0",
						"ExpressionChangedAfterItHasBeenCheckedError",
						"NullInjectorError",
						"TypeError:",
						"ReferenceError:"
					] as const
			},

		/**
		 * Confirmation messages.
		 */
		confirmation:
			{
				checkYourEmail: "Check Your Email",
				passwordChanged: "Password changed successfully"
			},

		/**
		 * Change password page text.
		 */
		changePassword:
			{
				requiredNotice: "You must change your password before continuing."
			},

		/**
		 * Email subjects.
		 */
		subjects:
			{
				verify: "Verify",
				reset: "Reset"
			},

		/**
		 * Form labels.
		 */
		labels:
			{
				usernameOrEmail: "Username or Email",
				password: "Password",
				rememberMe: "Remember me",
				emailAddress: "Email Address"
			},

		/**
		 * Description text.
		 */
		descriptions:
			{
				enterYourEmail: "Enter your email address",
				verificationLink: "verification link",
				passwordResetLink: "password reset link",
				selectFeature: "Select a feature to get started"
			},

		/**
		 * Home page card text.
		 */
		homeCards:
			{
				sandbox:
					{
						title: "Sandbox",
						description: "Experimentation area for testing new features and ideas",
						icon: "science"
					}
			},

		/**
		 * Action text.
		 */
		actions:
			{
				open: "Open"
			},

		/**
		 * Icon names.
		 */
		icons:
			{
				arrowForward: "arrow_forward",
				dashboard: "dashboard"
			},

		/**
		 * Admin dashboard text.
		 */
		adminDashboard:
			{
				tabs:
					{
						systemOverview: "System Overview",
						apiMetrics: "API Metrics",
						cacheMetrics: "Cache Metrics",
						externalSystems: "External Systems"
					},
				embedTitles:
					{
						systemHealth: "System Health & Metrics",
						apiEndpoint: "API Endpoint Metrics",
						valkeyCache: "Valkey Cache Metrics"
					},
				cards:
					{
						observabilityTools: "Observability Tools"
					},
				buttons:
					{
						jaegerTracing: "Jaeger Tracing"
					}
			},

		/**
		 * User management text.
		 */
		userManagement:
			{
				title: "User Management",
				subtitle: "Manage user accounts and permissions",
				createUser: "Create User"
			},

		/**
		 * Log management text.
		 */
		logManagement:
			{
				title: "Log Management",
				subtitle: "View and manage application logs"
			},

		/**
		 * Permission requests text.
		 */
		permissionRequests:
			{
				title: "Permission Requests",
				subtitle: "Review and manage user permission requests"
			},

		/**
		 * Profile page text.
		 */
		profile:
			{
				saveChanges: "Save Changes",
				requestPermissions: "Request Permissions"
			},

		/**
		 * Request permissions page text.
		 */
		requestPermissions:
			{
				title: "Request Permissions",
				subtitle: "Select roles you need access to",
				submitRequest: "Submit Request",
				noRolesAvailable: "No additional roles available"
			},

		/**
		 * Developer pages text.
		 */
		developer:
			{
				styleGuide:
					{
						title: "Style Guide",
						description: "Material Design 3 components and design tokens"
					},
				architectureGuide:
					{
						title: "Architecture Guide",
						description: "architecture patterns and conventions"
					}
			},

		/**
		 * Sandbox page text.
		 */
		sandbox:
			{
				title: "Sandbox",
				description: "experimentation area for testing new features"
			},

		/**
		 * Error page text.
		 */
		errorPage:
			{
				notFoundTitle: "404 - Page Not Found",
				notFoundDescription: "The page you're looking for doesn't exist",
				goToHome: "Go to Home"
			},

		/**
		 * Registration completion text.
		 */
		registerComplete:
			{
				heading: "Complete Registration",
				linkExpired: "Link Expired",
				passwordHint: "At least 8 characters with uppercase, lowercase, digit, and special character"
			},

		/**
		 * Set password / password reset text.
		 */
		setPassword:
			{
				invalidLink: "Invalid Link",
				linkExpired: "invalid or has expired"
			}
	} as const;
