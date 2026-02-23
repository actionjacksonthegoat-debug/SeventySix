// <copyright file="selectors.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Centralized selectors for E2E tests.
 * Update here when Angular components change.
 */
type SelectorsConfig = {
	card: { container: string; title: string; subtitle: string; content: string; };
	form: {
		submitButton: string;
		emailInput: string;
		usernameInput: string;
		passwordInput: string;
		rememberMeCheckbox: string;
		errorMessage: string;
		matError: string;
	};
	auth: {
		githubButton: string;
		oauthButton: string;
		forgotPasswordLink: string;
		signInLink: string;
		divider: string;
		description: string;
		successState: string;
	};
	mfaVerify: {
		codeInput: string;
		trustDeviceCheckbox: string;
		resendCodeButton: string;
		useBackupCodeButton: string;
		backToLoginButton: string;
	};
	changePassword: {
		currentPasswordInput: string;
		newPasswordInput: string;
		confirmPasswordInput: string;
		submitButton: string;
		requiredNotice: string;
		passwordHint: string;
	};
	setPassword: { newPasswordInput: string; confirmPasswordInput: string; invalidLinkSection: string; };
	totpSetup: {
		qrCodeImage: string;
		secretCode: string;
		verificationCodeInput: string;
		cantScanButton: string;
		scannedCodeButton: string;
		verifyEnableButton: string;
	};
	backupCodes: { codesGrid: string; codeItem: string; warningBox: string; };
	registerComplete: {
		usernameInput: string;
		passwordInput: string;
		confirmPasswordInput: string;
		submitButton: string;
	};
	userCreate: {
		createUserButton: string;
		usernameInput: string;
		emailInput: string;
		fullNameInput: string;
		saveErrorBanner: string;
	};
	userDetail: { saveChangesButton: string; usernameInput: string; emailInput: string; fullNameInput: string; };
	notification: { snackbar: string; };
	layout: { pageHeading: string; userMenuButton: string; logoutButton: string; };
	home: {
		heroSection: string;
		heroTitle: string;
		heroTagline: string;
		techStackSection: string;
		techCategory: string;
		techItem: string;
		statsBar: string;
		statItem: string;
		featuresSection: string;
		featureArticle: string;
		architectureSection: string;
		archCard: string;
		archCardHeader: string;
		archCardContent: string;
		ctaFooter: string;
		ctaCloneCommand: string;
	};
	adminDashboard: {
		tab: string;
		pageHeader: string;
		toolbarHeading: string;
		toolbarIcon: string;
		grafanaEmbed: string;
		apiStatsTable: string;
		observabilityCard: string;
		dataCard: string;
		observabilityButtons: string;
		jaegerButton: string;
		prometheusButton: string;
		grafanaButton: string;
		pgAdminButton: string;
		redisInsightButton: string;
	};
	accessibility: {
		skipLink: string;
		mainContent: string;
		banner: string;
		main: string;
		navigation: string;
		alert: string;
	};
	userManagement: { createUserButton: string; pageHeader: string; userList: string; dataTable: string; };
	logManagement: {
		pageHeader: string;
		logList: string;
		dataTable: string;
		detailDialog: string;
		messageContent: string;
	};
	permissionRequests: { pageHeader: string; dataTable: string; };
	profile: {
		profileCard: string;
		emailInput: string;
		fullNameInput: string;
		saveButton: string;
		requestPermissionsLink: string;
		linkedAccountsSection: string;
		linkedAccountsHeading: string;
		connectButton: string;
		disconnectButton: string;
	};
	requestPermissions: {
		roleCheckbox: string;
		messageTextarea: string;
		submitButton: string;
		noRolesMessage: string;
	};
	developer: {
		styleGuideHeader: string;
		styleGuideContainer: string;
		themeToggle: string;
		tabGroup: string;
		tab: string;
		colorSchemeSelect: string;
	};
	sandbox: { title: string; };
	errorPage: { container: string; errorTitle: string; homeButton: string; };
	dataTable: {
		table: string;
		headerRow: string;
		dataRow: string;
		emptyState: string;
		loadingSpinner: string;
		searchInput: string;
		matInput: string;
		chipOption: string;
		rowActionsButton: string;
		matTable: string;
		headerCell: string;
		iconButton: string;
		refreshButton: string;
	};
	dialog: { container: string; closeButton: string; };
	menu: { menuItem: string; warnMenuItem: string; };
	stepper: { stepHeader: string; };
	altcha: { widget: string; };
};

export const SELECTORS: SelectorsConfig =
	{
	/**
	 * Shared Material card selectors.
	 */
		card: {
			container: "mat-card",
			title: "mat-card-title",
			subtitle: "mat-card-subtitle",
			content: "mat-card-content"
		},

		/**
	 * Form element selectors.
	 */
		form: {
			submitButton: "button[type='submit']",
			emailInput: "#email",
			usernameInput: "#usernameOrEmail",
			passwordInput: "#password",
			rememberMeCheckbox: "[data-testid='remember-me']",
			errorMessage: "[role='alert'], .error-message, mat-error",
			matError: "mat-error"
		},

		/**
	 * Auth component selectors.
	 */
		auth: {
			githubButton: "button[aria-label='Continue with GitHub']",
			oauthButton: "[data-testid='oauth-button']",
			forgotPasswordLink: "a[href='/auth/forgot-password']",
			signInLink: "a[href='/auth/login']",
			divider: "[data-testid='divider']",
			description: ".description",
			successState: ".success-state"
		},

		/**
	 * MFA verify page selectors.
	 */
		mfaVerify: {
			codeInput: "#code",
			trustDeviceCheckbox: "[data-testid='trust-device-checkbox']",
			resendCodeButton: "[data-testid='resend-code-button']",
			useBackupCodeButton: "[data-testid='use-backup-code-button']",
			backToLoginButton: "[data-testid='back-to-login-button']"
		},

		/**
	 * Change password page selectors.
	 */
		changePassword: {
			currentPasswordInput: "[data-testid='current-password-input']",
			newPasswordInput: "[data-testid='new-password-input']",
			confirmPasswordInput: "[data-testid='confirm-password-input']",
			submitButton: "[data-testid='change-password-submit']",
			requiredNotice: "[data-testid='required-notice']",
			passwordHint: "#newPassword-hint"
		},

		/**
	 * Set password page selectors.
	 */
		setPassword: {
			newPasswordInput: "#newPassword",
			confirmPasswordInput: "#confirmPassword",
			invalidLinkSection: "[data-testid='invalid-link-section']"
		},

		/**
	 * TOTP setup page selectors.
	 */
		totpSetup: {
			qrCodeImage: "[data-testid='qr-code-image']",
			secretCode: "[data-testid='secret-code']",
			verificationCodeInput: "#verificationCode",
			cantScanButton: "button.link-button",
			scannedCodeButton: "button",
			verifyEnableButton: "button"
		},

		/**
	 * Backup codes page selectors.
	 */
		backupCodes: {
			codesGrid: "[data-testid='codes-grid']",
			codeItem: ".code-item",
			warningBox: ".warning-box"
		},

		/**
	 * Register complete page selectors.
	 */
		registerComplete: {
			usernameInput: "[data-testid='register-complete-username']",
			passwordInput: "[data-testid='register-complete-password']",
			confirmPasswordInput: "[data-testid='register-complete-confirm-password']",
			submitButton: "[data-testid='register-complete-submit']"
		},

		/**
	 * User create page selectors.
	 */
		userCreate: {
			createUserButton: "[data-testid='create-user-button']",
			usernameInput: "input[formcontrolname='username']",
			emailInput: "input[formcontrolname='email']",
			fullNameInput: "input[formcontrolname='fullName']",
			saveErrorBanner: "[data-testid='save-error-banner']"
		},

		/**
	 * User detail page selectors.
	 */
		userDetail: {
			saveChangesButton: "[data-testid='save-changes-button']",
			usernameInput: "input[formcontrolname='username']",
			emailInput: "input[formcontrolname='email']",
			fullNameInput: "input[formcontrolname='fullName']"
		},

		/**
	 * Notification selectors.
	 */
		notification: {
			snackbar: ".toast"
		},

		/**
	 * Layout selectors.
	 */
		layout: {
			pageHeading: "h1",
			userMenuButton: "[data-testid='user-menu-button']",
			logoutButton: "button:has-text('Logout')"
		},

		/**
	 * Home page selectors.
	 */
		home: {
			heroSection: "section.hero",
			heroTitle: ".hero-title",
			heroTagline: ".hero-tagline",
			techStackSection: "section#tech-stack",
			techCategory: ".tech-category",
			techItem: ".tech-item",
			statsBar: "section.stats-bar",
			statItem: ".stat-item",
			featuresSection: "section.features",
			featureArticle: "article.feature",
			architectureSection: "section.architecture",
			archCard: ".arch-card",
			archCardHeader: ".arch-card-header",
			archCardContent: ".arch-card-content",
			ctaFooter: "section.cta-footer",
			ctaCloneCommand: ".cta-footer-command"
		},

		/**
	 * Admin dashboard selectors.
	 */
		adminDashboard: {
			tab: ".mat-mdc-tab",
			pageHeader: ".admin-dashboard app-page-header",
			toolbarHeading: ".admin-dashboard app-page-header h1",
			toolbarIcon: ".admin-dashboard app-page-header mat-icon",
			grafanaEmbed: "app-grafana-dashboard-embed",
			apiStatsTable: "app-api-statistics-table",
			observabilityCard: "[data-testid='observability-card']",
			dataCard: "[data-testid='data-card']",
			observabilityButtons: ".observability-links button",
			jaegerButton: "button:has-text('Jaeger Tracing')",
			prometheusButton: "button:has-text('Prometheus Metrics')",
			grafanaButton: "button:has-text('Grafana Full View')",
			pgAdminButton: "[data-testid='pgadmin-button']",
			redisInsightButton: "[data-testid='redisinsight-button']"
		},

		/**
	 * Accessibility selectors.
	 */
		accessibility: {
			skipLink: ".skip-link",
			mainContent: "#main-content",
			banner: "[role='banner']",
			main: "main, [role='main']",
			navigation: "[role='navigation']",
			alert: "[role='alert']"
		},

		/**
	 * User management page selectors.
	 */
		userManagement: {
			createUserButton: "button:has-text('Create User')",
			pageHeader: "app-page-header",
			userList: "app-user-list",
			dataTable: "app-data-table"
		},

		/**
	 * Log management page selectors.
	 */
		logManagement: {
			pageHeader: "app-page-header",
			logList: "app-log-list",
			dataTable: "app-data-table",
			detailDialog: ".log-detail-dialog",
			messageContent: ".message-content"
		},

		/**
	 * Permission requests page selectors.
	 */
		permissionRequests: {
			pageHeader: "app-page-header",
			dataTable: "app-data-table"
		},

		/**
	 * Profile page selectors.
	 */
		profile: {
			profileCard: "mat-card",
			emailInput: "input[formcontrolname='email']",
			fullNameInput: "input[formcontrolname='fullName']",
			saveButton: "button[type='submit']",
			requestPermissionsLink: "a[routerlink='permissions']",
			linkedAccountsSection: "[data-testid='linked-accounts']",
			linkedAccountsHeading: "#linked-accounts-heading",
			connectButton: "button[aria-label='Connect GitHub']",
			disconnectButton: "button[aria-label='Disconnect GitHub']"
		},

		/**
	 * Request permissions page selectors.
	 */
		requestPermissions: {
			roleCheckbox: "mat-checkbox",
			messageTextarea: "textarea[formcontrolname='requestMessage']",
			submitButton: "button[type='submit']",
			noRolesMessage: ".no-roles"
		},

		/**
	 * Developer pages selectors.
	 */
		developer: {
			styleGuideHeader: ".style-guide-header h1",
			styleGuideContainer: ".style-guide-header",
			themeToggle: "button[aria-label='Toggle theme brightness']",
			tabGroup: "mat-tab-group",
			tab: ".mat-mdc-tab",
			colorSchemeSelect: "mat-select"
		},

		/**
	 * Sandbox page selectors.
	 */
		sandbox: {
			title: "h1.sandbox-title"
		},

		/**
	 * Error page selectors.
	 */
		errorPage: {
			container: ".error-page",
			errorTitle: "#error-title",
			homeButton: "button:has-text('Go to Home')"
		},

		/**
	 * Data table selectors (shared component).
	 */
		dataTable: {
			table: "table",
			headerRow: "tr.mat-mdc-header-row",
			dataRow: "tr.mat-mdc-row",
			emptyState: ".empty-state",
			loadingSpinner: "mat-spinner",
			searchInput: "input[placeholder*='Search']",
			matInput: "input[matinput]",
			chipOption: "mat-chip-option",
			rowActionsButton: "button[aria-label='Row actions']",
			matTable: "table[mat-table]",
			headerCell: "th[mat-header-cell]",
			iconButton: "button[mat-icon-button]",
			refreshButton: "button[aria-label*='Refresh']"
		},

		/**
	 * Dialog selectors.
	 */
		dialog: {
			container: "mat-dialog-container",
			closeButton: "button[aria-label*='Close']"
		},

		/**
	 * Menu selectors.
	 */
		menu: {
			menuItem: "button.mat-mdc-menu-item",
			warnMenuItem: "button.mat-mdc-menu-item.warn-action"
		},

		/**
	 * Stepper selectors.
	 */
		stepper: {
			stepHeader: ".mat-step-header"
		},

		/**
	 * Altcha proof-of-work widget selectors.
	 */
		altcha: {
			widget: "altcha-widget"
		}
	} as const;