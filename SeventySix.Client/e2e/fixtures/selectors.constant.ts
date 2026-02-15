// <copyright file="selectors.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Centralized selectors for E2E tests.
 * Update here when Angular components change.
 */
export const SELECTORS =
	{
		/**
		 * Shared Material card selectors.
		 */
		card:
			{
				container: "mat-card",
				title: "mat-card-title",
				subtitle: "mat-card-subtitle",
				content: "mat-card-content"
			},

		/**
		 * Form element selectors.
		 */
		form:
			{
				submitButton: "button[type='submit']",
				emailInput: "#email",
				usernameInput: "#usernameOrEmail",
				passwordInput: "#password",
				rememberMeCheckbox: "#rememberMe",
				errorMessage: "[role='alert'], .error-message, mat-error",
				matError: "mat-error"
			},

		/**
		 * Auth component selectors.
		 */
		auth:
			{
				githubButton: ".github-button",
				forgotPasswordLink: "a[href='/auth/forgot-password']",
				signInLink: "a[href='/auth/login']",
				divider: ".divider",
				description: ".description",
				successState: ".success-state"
			},

		/**
		 * MFA verify page selectors.
		 */
		mfaVerify:
			{
				codeInput: "#code",
				trustDeviceCheckbox: "[data-testid='trust-device-checkbox']",
				resendCodeButton: "[data-testid='resend-code-button']",
				useBackupCodeButton: "[data-testid='use-backup-code-button']",
				backToLoginButton: "[data-testid='back-to-login-button']"
			},

		/**
		 * Change password page selectors.
		 */
		changePassword:
			{
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
		setPassword:
			{
				newPasswordInput: "#newPassword",
				confirmPasswordInput: "#confirmPassword",
				invalidLinkSection: "[data-testid='invalid-link-section']"
			},

		/**
		 * TOTP setup page selectors.
		 */
		totpSetup:
			{
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
		backupCodes:
			{
				codesGrid: "[data-testid='codes-grid']",
				codeItem: ".code-item",
				warningBox: ".warning-box"
			},

		/**
		 * Register complete page selectors.
		 */
		registerComplete:
			{
				usernameInput: "[data-testid='register-complete-username']",
				passwordInput: "[data-testid='register-complete-password']",
				confirmPasswordInput: "[data-testid='register-complete-confirm-password']",
				submitButton: "[data-testid='register-complete-submit']"
			},

		/**
		 * User create page selectors.
		 */
		userCreate:
			{
				createUserButton: "[data-testid='create-user-button']",
				usernameInput: "input[formcontrolname='username']",
				emailInput: "input[formcontrolname='email']",
				fullNameInput: "input[formcontrolname='fullName']",
				saveErrorBanner: "[data-testid='save-error-banner']"
			},

		/**
		 * User detail page selectors.
		 */
		userDetail:
			{
				saveChangesButton: "[data-testid='save-changes-button']",
				usernameInput: "input[formcontrolname='username']",
				emailInput: "input[formcontrolname='email']",
				fullNameInput: "input[formcontrolname='fullName']"
			},

		/**
		 * Notification selectors.
		 */
		notification:
			{
				snackbar: ".toast"
			},

		/**
		 * Layout selectors.
		 */
		layout:
			{
				pageHeading: "h1",
				userMenuButton: "[data-testid='user-menu-button']",
				logoutButton: "button:has-text('Logout')"
			},

		/**
		 * Home page selectors.
		 */
		home:
			{
				featureCard: ".feature-card",
				cardTitle: "mat-card-title",
				cardContent: "mat-card-content p",
				cardActionText: ".card-action-text",
				cardActionIcon: ".card-action-text mat-icon",
				featureIcon: ".feature-icon",
				subtitle: ".subtitle"
			},

		/**
		 * Admin dashboard selectors.
		 */
		adminDashboard:
			{
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
		accessibility:
			{
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
		userManagement:
			{
				createUserButton: "button:has-text('Create User')",
				pageHeader: "app-page-header",
				userList: "app-user-list",
				dataTable: "app-data-table"
			},

		/**
		 * Log management page selectors.
		 */
		logManagement:
			{
				pageHeader: "app-page-header",
				logList: "app-log-list",
				dataTable: "app-data-table",
				detailDialog: ".log-detail-dialog",
				messageContent: ".message-content"
			},

		/**
		 * Permission requests page selectors.
		 */
		permissionRequests:
			{
				pageHeader: "app-page-header",
				dataTable: "app-data-table"
			},

		/**
		 * Profile page selectors.
		 */
		profile:
			{
				profileCard: "mat-card",
				emailInput: "input[formcontrolname='email']",
				fullNameInput: "input[formcontrolname='fullName']",
				saveButton: "button[type='submit']",
				requestPermissionsLink: "a[routerlink='permissions']"
			},

		/**
		 * Request permissions page selectors.
		 */
		requestPermissions:
			{
				roleCheckbox: "mat-checkbox",
				messageTextarea: "textarea[formcontrolname='requestMessage']",
				submitButton: "button[type='submit']",
				noRolesMessage: ".no-roles"
			},

		/**
		 * Developer pages selectors.
		 */
		developer:
			{
				styleGuideHeader: ".style-guide-header h1",
				styleGuideContainer: ".style-guide-header",
				architectureGuideHeader: ".architecture-guide-container h1",
				themeToggle: "button[aria-label='Toggle theme brightness']",
				tabGroup: "mat-tab-group",
				tab: ".mat-mdc-tab",
				colorSchemeSelect: "mat-select"
			},

		/**
		 * Sandbox page selectors.
		 */
		sandbox:
			{
				container: ".sandbox-container",
				sandboxCard: ".sandbox-card",
				sandboxTitle: ".sandbox-card mat-card-title h1",
				cardContent: "mat-card-content"
			},

		/**
		 * Error page selectors.
		 */
		errorPage:
			{
				container: ".error-page",
				errorTitle: "#error-title",
				homeButton: "button:has-text('Go to Home')"
			},

		/**
		 * Data table selectors (shared component).
		 */
		dataTable:
			{
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
		dialog:
			{
				container: "mat-dialog-container",
				closeButton: "button[aria-label*='Close']"
			},

		/**
		 * Menu selectors.
		 */
		menu:
			{
				menuItem: "button.mat-mdc-menu-item",
				warnMenuItem: "button.mat-mdc-menu-item.warn-action"
			},

		/**
		 * Stepper selectors.
		 */
		stepper:
			{
				stepHeader: ".mat-step-header"
			},

		/**
		 * Altcha proof-of-work widget selectors.
		 */
		altcha:
			{
				widget: "altcha-widget"
			}
	} as const;
