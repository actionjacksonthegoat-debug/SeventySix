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
		 * Form element selectors.
		 */
		form:
			{
				submitButton: "button[type='submit']",
				emailInput: "#email",
				usernameInput: "#usernameOrEmail",
				passwordInput: "#password",
				rememberMeCheckbox: "#rememberMe"
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
		 * Notification selectors.
		 */
		notification:
			{
				snackbar: "simple-snack-bar"
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
				navigation: "[role='navigation']"
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
				dataTable: "app-data-table"
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
				architectureGuideHeader: ".architecture-guide-container h1",
				themeToggle: "button[aria-label='Toggle theme brightness']"
			},

		/**
		 * Sandbox page selectors.
		 */
		sandbox:
			{
				container: ".sandbox-container",
				sandboxCard: ".sandbox-card",
				sandboxTitle: ".sandbox-card mat-card-title h1"
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
				refreshButton: "button[aria-label*='Refresh']"
			}
	} as const;
