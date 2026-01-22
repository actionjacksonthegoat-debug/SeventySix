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
				adminDashboard: "Admin Dashboard"
			},

		/**
		 * Button text patterns.
		 */
		buttons:
			{
				continueWithGithub: /Continue with GitHub/,
				sendResetLink: /Send Reset Link|Sending/,
				continue: /Continue|Sending/,
				logout: "Logout"
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
				checkYourEmail: "Check Your Email"
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
			}
	} as const;
