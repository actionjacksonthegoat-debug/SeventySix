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
				observabilityCard: "mat-card-title:has-text('Observability Tools')",
				observabilityButtons: ".observability-links button",
				jaegerButton: "button:has-text('Jaeger Tracing')",
				prometheusButton: "button:has-text('Prometheus Metrics')",
				grafanaButton: "button:has-text('Grafana Full View')"
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
			}
	} as const;
