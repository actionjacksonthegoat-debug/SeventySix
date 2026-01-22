/**
 * Mock Factory Functions
 * Centralized mock creation for common services
 * Eliminates duplication across 40+ spec files
 */

import { Observable, of } from "rxjs";
import { type Mock, vi } from "vitest";

/** Mock LoggerService interface for testing. */
export interface MockLoggerService
{
	debug: Mock;
	info: Mock;
	warning: Mock;
	error: Mock;
	critical: Mock;
	forceDebug: Mock;
	forceInfo: Mock;
	forceWarning: Mock;
	forceError: Mock;
	forceCritical: Mock;
}

/**
 * Create a mocked LoggerService.
 * Used in 15+ test files.
 *
 * @returns {MockLoggerService}
 * Vitest mock object implementing the LoggerService shape for tests.
 */
export function createMockLogger(): MockLoggerService
{
	return {
		debug: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
		error: vi.fn(),
		critical: vi.fn(),
		forceDebug: vi.fn(),
		forceInfo: vi.fn(),
		forceWarning: vi.fn(),
		forceError: vi.fn(),
		forceCritical: vi.fn()
	};
}

/** Mock NotificationService interface for testing. */
export interface MockNotificationService
{
	success: Mock;
	info: Mock;
	warning: Mock;
	warningWithAction: Mock;
	error: Mock;
	errorWithDetails: Mock;
	dismiss: Mock;
	clearAll: Mock;
}

/**
 * Create a mocked NotificationService.
 * Used in 10+ test files.
 *
 * @returns {MockNotificationService}
 * Vitest mock object implementing the NotificationService shape for tests.
 */
export function createMockNotificationService(): MockNotificationService
{
	return {
		success: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
		warningWithAction: vi.fn(),
		error: vi.fn(),
		errorWithDetails: vi.fn(),
		dismiss: vi.fn(),
		clearAll: vi.fn()
	};
}

/** Mock Router interface for testing. */
export interface MockRouter
{
	navigate: Mock;
	navigateByUrl: Mock;
}

/**
 * Create a mocked Router.
 * Used in 8+ test files.
 *
 * @returns {MockRouter}
 * Vitest mock object implementing the Router methods used in tests.
 */
export function createMockRouter(): MockRouter
{
	return {
		navigate: vi.fn(),
		navigateByUrl: vi.fn()
	};
}

/** Mock ActivatedRoute interface for testing. */
export interface MockActivatedRoute
{
	params: Observable<Record<string, unknown>>;
	snapshot: {
		params: Record<string, unknown>;
		queryParams: Record<string, unknown>;
		data: Record<string, unknown>;
		paramMap: { get: (key: string) => unknown; };
	};
}

/**
 * Create a mocked ActivatedRoute.
 * Used in 5+ test files.
 *
 * @param {Record<string, unknown>} params
 * Optional route params to expose via `params` observable and snapshot.
 * @returns {MockActivatedRoute}
 * Mock object representing an Angular ActivatedRoute for tests.
 */
export function createMockActivatedRoute(
	params: Record<string, unknown> = {}): MockActivatedRoute
{
	return {
		params: of(params),
		snapshot: {
			params,
			queryParams: {},
			data: {},
			paramMap: {
				get: (key: string): unknown =>
					params[key] ?? null
			}
		}
	};
}

/** Mock MatDialog interface for testing. */
export interface MockDialog
{
	open: Mock;
	closeAll: Mock;
}

/**
 * Create a mocked MatDialog.
 * Used in 4+ test files.
 *
 * @returns {MockDialog}
 * Vitest mock object implementing MatDialog methods for tests.
 */
export function createMockDialog(): MockDialog
{
	return {
		open: vi.fn(),
		closeAll: vi.fn()
	};
}

/** Mock MatDialogRef interface for testing. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface MockDialogRef<T>
{
	close: Mock;
	afterClosed: Mock;
}

/**
 * Create a mocked MatDialogRef.
 * Used in dialog component tests.
 *
 * @returns {MockDialogRef<T>}
 * Vitest mock object implementing MatDialogRef for tests.
 */
export function createMockDialogRef<T>(): MockDialogRef<T>
{
	return {
		close: vi.fn(),
		afterClosed: vi.fn()
	};
}

/** Mock ErrorQueueService interface for testing. */
export interface MockErrorQueueService
{
	enqueue: Mock;
	getQueueSize: Mock;
	clearQueue: Mock;
}

/**
 * Create a mocked ErrorQueueService.
 * Used in error handling tests.
 *
 * @returns {MockErrorQueueService}
 * Vitest mock object implementing ErrorQueueService methods for tests.
 */
export function createMockErrorQueueService(): MockErrorQueueService
{
	return {
		enqueue: vi.fn(),
		getQueueSize: vi.fn(),
		clearQueue: vi.fn()
	};
}

/**
 * Mock UserRepository type for testing
 */
export interface MockUserRepository
{
	getAll: Mock;
	getById: Mock;
	create: Mock;
	update: Mock;
	delete: Mock;
	getPaged: Mock;
}

/**
 * Create a mocked UserRepository.
 * Used in user feature tests.
 *
 * @returns {MockUserRepository}
 * Vitest mock object implementing repository methods used in tests.
 */
export function createMockUserRepository(): MockUserRepository
{
	return {
		getAll: vi.fn(),
		getById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		getPaged: vi.fn()
	};
}

/** Mock LogRepository type for testing. */
export interface MockLogRepository
{
	getAllPaged: Mock;
	getById: Mock;
	delete: Mock;
	deleteBatch: Mock;
}

/**
 * Create a mocked LogRepository.
 * Used in log management feature tests.
 *
 * @returns {MockLogRepository}
 * Vitest mock object implementing LogRepository methods.
 */
export function createMockLogRepository(): MockLogRepository
{
	return {
		getAllPaged: vi.fn(),
		getById: vi.fn(),
		delete: vi.fn(),
		deleteBatch: vi.fn()
	};
}

/**
 * Mock ApiService interface for testing
 */
export interface MockApiService
{
	get: Mock;
	post: Mock;
	put: Mock;
	delete: Mock;
}

/**
 * Create a mocked ApiService
 * Used in repository tests
 *
 * @returns {MockApiService}
 * Vitest mock object for ApiService
 */
export function createMockApiService(): MockApiService
{
	return {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn()
	};
}

/**
 * Mock LayoutService interface for testing
 * Simulates signal-based properties with Vitest mocks
 */
export interface MockLayoutService
{
	setSidebarExpanded: Mock;
	toggleSidebar: Mock;
	openSidebar: Mock;
	closeSidebar: Mock;
	sidebarMode: Mock;
	sidebarExpanded: Mock;
}

/**
 * Create a mocked LayoutService
 * Used in App, Header, and Sidebar component tests
 * @returns {MockLayoutService}
 * Mock object for LayoutService with signal-like properties
 */
export function createMockLayoutService(): MockLayoutService
{
	return {
		setSidebarExpanded: vi.fn(),
		toggleSidebar: vi.fn(),
		openSidebar: vi.fn(),
		closeSidebar: vi.fn(),
		sidebarMode: vi
			.fn()
			.mockReturnValue("side"),
		sidebarExpanded: vi
			.fn()
			.mockReturnValue(true)
	};
}

/** Mock RecaptchaService interface for testing. */
export interface MockRecaptchaService
{
	executeAsync: Mock;
	reset: Mock;
}

/**
 * Create a mocked RecaptchaService.
 * Used in auth component tests (login, register, forgot-password).
 *
 * @param {string | null} resolvedToken
 * Optional token value that executeAsync should resolve with.
 * @returns {MockRecaptchaService}
 * Vitest mock object implementing RecaptchaService methods for tests.
 */
export function createMockRecaptchaService(
	resolvedToken: string | null = null): MockRecaptchaService
{
	return {
		executeAsync: vi
			.fn()
			.mockResolvedValue(resolvedToken),
		reset: vi.fn()
	};
}
