/**
 * Mock Factory Functions
 * Centralized mock creation for common services
 * Eliminates duplication across 40+ spec files
 */

import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { ErrorQueueService } from "@shared/services/error-queue.service";
import { LoggerService } from "@shared/services/logger.service";
import { NotificationService } from "@shared/services/notification.service";
import { of } from "rxjs";

/**
 * Create a mocked LoggerService
 * Used in 15+ test files
 *
 * @returns Jasmine spy object for LoggerService
 */
export function createMockLogger(): jasmine.SpyObj<LoggerService>
{
	return jasmine.createSpyObj("LoggerService",
		[
			"debug",
			"info",
			"warning",
			"error",
			"critical",
			"forceDebug",
			"forceInfo",
			"forceWarning",
			"forceError",
			"forceCritical"
		]);
}

/**
 * Create a mocked NotificationService
 * Used in 10+ test files
 *
 * @returns Jasmine spy object for NotificationService
 */
export function createMockNotificationService(): jasmine.SpyObj<NotificationService>
{
	return jasmine.createSpyObj("NotificationService",
		[
			"success",
			"info",
			"warning",
			"warningWithAction",
			"error",
			"errorWithDetails",
			"dismiss",
			"clearAll"
		]);
}

/**
 * Create a mocked Router
 * Used in 8+ test files
 *
 * @returns Jasmine spy object for Router
 */
export function createMockRouter(): jasmine.SpyObj<Router>
{
	return jasmine.createSpyObj("Router",
		["navigate", "navigateByUrl"]);
}

/**
 * Create a mocked ActivatedRoute
 * Used in 5+ test files
 *
 * @param params - Optional route params
 * @returns Jasmine spy object for ActivatedRoute
 */
export function createMockActivatedRoute(
	params: Record<string, unknown> = {}): jasmine.SpyObj<ActivatedRoute>
{
	const mock: jasmine.SpyObj<ActivatedRoute> =
		jasmine.createSpyObj(
			"ActivatedRoute",
			[],
			{
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
			});
	return mock;
}

/**
 * Create a mocked MatDialog
 * Used in 4+ test files
 *
 * @returns Jasmine spy object for MatDialog
 */
export function createMockDialog(): jasmine.SpyObj<MatDialog>
{
	return jasmine.createSpyObj("MatDialog",
		["open", "closeAll"]);
}

/**
 * Create a mocked MatDialogRef
 * Used in dialog component tests
 *
 * @returns Jasmine spy object for MatDialogRef
 */
export function createMockDialogRef<T>(): jasmine.SpyObj<MatDialogRef<T>>
{
	return jasmine.createSpyObj("MatDialogRef",
		["close", "afterClosed"]);
}

/**
 * Create a mocked ErrorQueueService
 * Used in error handling tests
 *
 * @returns Jasmine spy object for ErrorQueueService
 */
export function createMockErrorQueueService(): jasmine.SpyObj<ErrorQueueService>
{
	return jasmine.createSpyObj("ErrorQueueService",
		[
			"enqueue",
			"getQueueSize",
			"clearQueue"
		]);
}

/**
 * Mock UserRepository type for testing
 */
export interface MockUserRepository
{
	getAll: jasmine.Spy;
	getById: jasmine.Spy;
	create: jasmine.Spy;
	update: jasmine.Spy;
	delete: jasmine.Spy;
	getPaged: jasmine.Spy;
}

/**
 * Create a mocked UserRepository
 * Used in user feature tests
 *
 * @returns Jasmine spy object for UserRepository
 */
export function createMockUserRepository(): jasmine.SpyObj<MockUserRepository>
{
	return jasmine.createSpyObj("UserRepository",
		[
			"getAll",
			"getById",
			"create",
			"update",
			"delete",
			"getPaged"
		]);
}

/** Mock LogRepository type for testing. */
export interface MockLogRepository
{
	getAllPaged: jasmine.Spy;
	getById: jasmine.Spy;
	delete: jasmine.Spy;
	deleteBatch: jasmine.Spy;
}

/** Create a mocked LogRepository. Used in log management feature tests. */
export function createMockLogRepository(): jasmine.SpyObj<MockLogRepository>
{
	return jasmine.createSpyObj("LogRepository",
		[
			"getAllPaged",
			"getById",
			"delete",
			"deleteBatch"
		]);
}

/**
 * Mock ApiService interface for testing
 */
export interface MockApiService
{
	get: jasmine.Spy;
	post: jasmine.Spy;
	put: jasmine.Spy;
	delete: jasmine.Spy;
}

/**
 * Create a mocked ApiService
 * Used in repository tests
 *
 * @returns Jasmine spy object for ApiService
 */
export function createMockApiService(): jasmine.SpyObj<MockApiService>
{
	return jasmine.createSpyObj("ApiService",
		["get", "post", "put", "delete"]);
}

/**
 * Mock LayoutService interface for testing
 * Simulates signal-based properties with jasmine spies
 */
export interface MockLayoutService
{
	setSidebarExpanded: jasmine.Spy;
	toggleSidebar: jasmine.Spy;
	openSidebar: jasmine.Spy;
	closeSidebar: jasmine.Spy;
	sidebarMode: jasmine.Spy;
	sidebarExpanded: jasmine.Spy;
}

/**
 * Create a mocked LayoutService
 * Used in App, Header, and Sidebar component tests
 *
 * @returns Mock object for LayoutService with signal-like properties
 */
export function createMockLayoutService(): MockLayoutService
{
	const mock: MockLayoutService =
		jasmine.createSpyObj("LayoutService",
			[
				"setSidebarExpanded",
				"toggleSidebar",
				"openSidebar",
				"closeSidebar"
			]) as MockLayoutService;

	// Add signal-like computed properties
	mock.sidebarMode =
		jasmine.createSpy("sidebarMode").and.returnValue("side");
	mock.sidebarExpanded =
		jasmine
		.createSpy("sidebarExpanded")
		.and
		.returnValue(true);

	return mock;
}
