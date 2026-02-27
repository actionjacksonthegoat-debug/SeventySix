// <copyright file="page-text.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Expected page text for assertions.
 * Update when UI copy changes.
 */
type PageTextConfig = {
	headings: {
		signIn: string;
		createAccount: string;
		register: string;
		forgotPassword: string;
		checkYourEmail: string;
		adminDashboard: string;
		changePassword: string;
		setNewPassword: string;
		invalidLink: string;
		createNewUser: string;
		verifyYourIdentity: string;
		authenticatorCode: string;
		useBackupCode: string;
		setUpAuthenticatorApp: string;
		verifySetup: string;
		authenticatorEnabled: string;
		generateBackupCodes: string;
		saveYourBackupCodes: string;
		backupCodesSaved: string;
	};
	buttons: {
		continueWithGithub: RegExp;
		sendResetLink: RegExp;
		continue: RegExp;
		logout: string;
		verify: RegExp;
		changePassword: RegExp;
		setPassword: RegExp;
		createUser: RegExp;
		generateCodes: string;
		savedMyCodes: string;
		next: string;
		cantScan: string;
		scannedCode: string;
		verifyAndEnable: string;
	};
	links: { forgotPassword: string; returnToSignIn: string; returnToLogin: string; };
	validation: { enterUsernamePassword: string; enterEmail: string; validEmail: string; minimumCharacters: string; };
	errors: {
		accessDenied: string;
		error: string;
		serverPatterns: ReadonlyArray<string>;
		clientPatterns: ReadonlyArray<string>;
		httpPatterns: ReadonlyArray<string>;
		angularPatterns: ReadonlyArray<string>;
	};
	confirmation: {
		checkYourEmail: string;
		passwordChanged: string;
		userUpdated: string;
		permissionRequestSubmitted: string;
	};
	changePassword: { requiredNotice: string; };
	subjects: { verify: string; reset: string; };
	labels: {
		usernameOrEmail: string;
		password: string;
		rememberMe: string;
		emailAddress: string;
		roleSelection: string;
	};
	descriptions: { enterYourEmail: string; verificationLink: string; passwordResetLink: string; };
	icons: { dashboard: string; };
	adminDashboard: {
		tabs: { systemOverview: string; apiMetrics: string; cacheMetrics: string; externalSystems: string; };
		embedTitles: { systemHealth: string; apiEndpoint: string; valkeyCache: string; };
		cards: { observabilityTools: string; };
		buttons: { jaegerTracing: string; };
	};
	userManagement: { title: string; subtitle: string; createUser: string; activeFilter: string; };
	userCreate: { failedToCreate: string; };
	logManagement: {
		title: string;
		subtitle: string;
		chips: { warnings: string; errors: string; };
	};
	permissionRequests: { title: string; subtitle: string; };
	profile: {
		saveChanges: string;
		requestPermissions: string;
		profileUpdated: string;
		linkedAccountsHeading: string;
		connectDescription: string;
		connectButton: string;
		disconnectButton: string;
	};
	requestPermissions: { title: string; subtitle: string; submitRequest: string; noRolesAvailable: string; };
	home: {
		landingPage: {
			heroTitle: string;
			heroTagline: string;
			techStackHeading: string;
			featuresHeading: string;
			architectureHeading: string;
			ctaTitle: string;
			cloneCommand: string;
		};
	};
	developer: {
		styleGuide: { title: string; description: string; colorsTab: string; };
	};
	sandbox: { title: string; };
	errorPage: { notFoundTitle: string; notFoundDescription: string; goToHome: string; };
	registerComplete: { heading: string; linkExpired: string; passwordHint: string; };
	setPassword: { invalidLink: string; linkExpired: string; };
};

export const PAGE_TEXT: PageTextConfig =
	{
	/**
	 * Page headings.
	 */
		headings: {
			signIn: "Sign In",
			createAccount: "Create Account",
			register: "Register",
			forgotPassword: "Forgot Password",
			checkYourEmail: "Check Your Email",
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
		buttons: {
			continueWithGithub: /Continue with GitHub/,
			sendResetLink: /Send Reset Link|Sending/,
			continue: /Continue|Sending/,
			logout: "Logout",
			verify: /Verify|Verifying/,
			changePassword: /Change Password|Changing/,
			setPassword: /Set Password|Setting Password/,
			createUser: /Create User/,
			generateCodes: "Generate Codes",
			savedMyCodes: "I've Saved My Codes",
			next: "Next",
			cantScan: "Can't scan",
			scannedCode: "I've scanned the code",
			verifyAndEnable: "Verify & Enable"
		},

		/**
	 * Link text.
	 */
		links: {
			forgotPassword: "Forgot password?",
			returnToSignIn: "Return to Sign In",
			returnToLogin: "Return to Login"
		},

		/**
	 * Validation messages.
	 */
		validation: {
			enterUsernamePassword: "Please enter username and password",
			enterEmail: "Please enter an email address",
			validEmail: "valid email",
			minimumCharacters: "8 characters"
		},

		/**
	 * Error messages and patterns to detect application failures.
	 * Comprehensive patterns catch server errors, client errors, and UI error states.
	 */
		errors: {
			accessDenied: "Access Denied",
			error: "Error",
			/**
		 * Patterns that indicate server-side failures.
		 * Use specific phrases that only appear on error pages/overlays,
		 * not in data tables that legitimately render HTTP status codes.
		 */
			serverPatterns: [
				"500 - Server Error",
				"Internal Server Error",
				"502 Bad Gateway",
				"503 Service Unavailable",
				"504 Gateway Timeout"
			] as const,
			/**
		 * Patterns that indicate client-side application errors.
		 */
			clientPatterns: [
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
			httpPatterns: [
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
			angularPatterns: [
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
		confirmation: {
			checkYourEmail: "Check Your Email",
			passwordChanged: "Password changed successfully",
			userUpdated: "User updated successfully",
			permissionRequestSubmitted: "Permission request submitted"
		},

		/**
	 * Change password page text.
	 */
		changePassword: {
			requiredNotice: "You must change your password before continuing."
		},

		/**
	 * Email subjects.
	 */
		subjects: {
			verify: "Verify",
			reset: "Reset"
		},

		/**
	 * Form labels.
	 */
		labels: {
			usernameOrEmail: "Username or Email",
			password: "Password",
			rememberMe: "Stay signed in",
			emailAddress: "Email Address",
			roleSelection: "Role selection"
		},

		/**
	 * Description text.
	 */
		descriptions: {
			enterYourEmail: "Enter your email address",
			verificationLink: "verification link",
			passwordResetLink: "password reset link"
		},

		/**
	 * Icon names.
	 */
		icons: {
			dashboard: "dashboard"
		},

		/**
	 * Admin dashboard text.
	 */
		adminDashboard: {
			tabs: {
				systemOverview: "System Overview",
				apiMetrics: "API Metrics",
				cacheMetrics: "Cache Metrics",
				externalSystems: "External Systems"
			},
			embedTitles: {
				systemHealth: "System Health & Metrics",
				apiEndpoint: "API Endpoint Metrics",
				valkeyCache: "Valkey Cache Metrics"
			},
			cards: {
				observabilityTools: "Observability Tools"
			},
			buttons: {
				jaegerTracing: "Jaeger Tracing"
			}
		},

		/**
	 * User management text.
	 */
		userManagement: {
			title: "User Management",
			subtitle: "Manage user accounts and permissions",
			createUser: "Create User",
			activeFilter: "Active"
		},

		/**
	 * User create text.
	 */
		userCreate: {
			failedToCreate: "Failed to create user"
		},

		/**
	 * Log management text.
	 */
		logManagement: {
			title: "Log Management",
			subtitle: "View and manage application logs",
			chips: {
				warnings: "Warnings",
				errors: "Errors"
			}
		},

		/**
	 * Permission requests text.
	 */
		permissionRequests: {
			title: "Permission Requests",
			subtitle: "Review and manage user permission requests"
		},

		/**
	 * Profile page text.
	 */
		profile: {
			saveChanges: "Save Changes",
			requestPermissions: "Request Permissions",
			profileUpdated: "Profile updated",
			linkedAccountsHeading: "Linked Accounts",
			connectDescription: "Connect external accounts for easier sign-in.",
			connectButton: "Connect",
			disconnectButton: "Disconnect"
		},

		/**
	 * Request permissions page text.
	 */
		requestPermissions: {
			title: "Request Permissions",
			subtitle: "Select roles you need access to",
			submitRequest: "Submit Request",
			noRolesAvailable: "No additional roles available"
		},

		/**
	 * Home page text.
	 */
		home: {
			landingPage: {
				heroTitle: "SeventySix",
				heroTagline: "Secure. Observable. AI-Driven.",
				techStackHeading: "Built With",
				featuresHeading: "Key Features",
				architectureHeading: "Architecture Patterns",
				ctaTitle: "Free Forever. Open Source.",
				cloneCommand: "git clone https://github.com/actionjacksonthegoat-debug/SeventySix.git"
			}
		},

		/**
	 * Developer pages text.
	 */
		developer: {
			styleGuide: {
				title: "Style Guide",
				description: "Material Design 3 components and design tokens",
				colorsTab: "Colors"
			}
		},

		/**
	 * Sandbox page text.
	 */
		sandbox: {
			title: "Hello World"
		},

		/**
	 * Error page text.
	 */
		errorPage: {
			notFoundTitle: "404 - Page Not Found",
			notFoundDescription: "The page you're looking for doesn't exist",
			goToHome: "Go to Home"
		},

		/**
	 * Registration completion text.
	 */
		registerComplete: {
			heading: "Complete Registration",
			linkExpired: "Link Expired",
			passwordHint: "At least 8 characters with uppercase, lowercase, digit, and special character"
		},

		/**
	 * Set password / password reset text.
	 */
		setPassword: {
			invalidLink: "Invalid Link",
			linkExpired: "invalid or has expired"
		}
	} as const;