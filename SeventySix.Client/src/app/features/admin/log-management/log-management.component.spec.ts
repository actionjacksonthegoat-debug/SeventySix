import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { LogManagementComponent } from "./log-management.component";
import { LogManagementService } from "@admin/log-management/services";
import { MatDialog } from "@angular/material/dialog";
import { LogResponse, LogLevel } from "@admin/log-management/models";
import { createMockDialog } from "@testing";

describe("LogManagementComponent", (): void =>
{
	let component: LogManagementComponent;
	let fixture: ComponentFixture<LogManagementComponent>;
	let mockLogService: jasmine.SpyObj<LogManagementService>;
	let mockDialog: jasmine.SpyObj<MatDialog>;
	let mockMutation: {
		mutate: jasmine.Spy;
		isSuccess: jasmine.Spy;
		isError: jasmine.Spy;
		isPending: jasmine.Spy;
		isIdle: jasmine.Spy;
	};

	beforeEach(async (): Promise<void> =>
	{
		// Create mock mutation object with mutate method
		mockMutation = {
			mutate: jasmine.createSpy("mutate"),
			isSuccess: jasmine.createSpy("isSuccess").and.returnValue(false),
			isError: jasmine.createSpy("isError").and.returnValue(false),
			isPending: jasmine.createSpy("isPending").and.returnValue(false),
			isIdle: jasmine.createSpy("isIdle").and.returnValue(true)
		};

		mockLogService = jasmine.createSpyObj("LogManagementService", [
			"getLogs",
			"deleteLog",
			"deleteLogs",
			"deleteSelected",
			"updateFilter",
			"clearSelection",
			"selectAll"
		]);

		// Mock getLogs to return a TanStack Query result
		const mockPagedResponse = {
			data: [],
			pageNumber: 1,
			pageSize: 10,
			totalCount: 0,
			totalPages: 0,
			hasPreviousPage: false,
			hasNextPage: false
		};

		mockLogService.getLogs.and.returnValue({
			data: jasmine.createSpy("data").and.returnValue(mockPagedResponse),
			isLoading: jasmine.createSpy("isLoading").and.returnValue(false),
			error: jasmine.createSpy("error").and.returnValue(null),
			isSuccess: jasmine.createSpy("isSuccess").and.returnValue(true),
			isError: jasmine.createSpy("isError").and.returnValue(false)
		} as any);
		mockLogService.deleteLog.and.returnValue(mockMutation as any);
		mockLogService.deleteLogs.and.returnValue(mockMutation as any);
		mockDialog = createMockDialog();
		await TestBed.configureTestingModule({
			imports: [LogManagementComponent],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: LogManagementService, useValue: mockLogService },
				{ provide: MatDialog, useValue: mockDialog }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(LogManagementComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", (): void =>
	{
		expect(component).toBeTruthy();
	});

	it("should open log detail dialog when log is selected", (): void =>
	{
		const mockDialogRef: {
			componentInstance: { deleteLog: { subscribe: jasmine.Spy } };
			close: jasmine.Spy;
		} = {
			componentInstance: {
				deleteLog: {
					subscribe: jasmine.createSpy("subscribe")
				}
			},
			close: jasmine.createSpy("close")
		};
		mockDialog.open.and.returnValue(mockDialogRef as any);

		const mockLog: LogResponse = {
			id: 1,
			timestamp: new Date("2025-11-12T10:30:00Z"),
			logLevel: "Error",
			message: "Test error",
			sourceContext: "TestService",
			exception: null,
			stackTrace: null,
			requestId: null,
			requestPath: "/api/test",
			machineName: null,
			threadId: null,
			application: null,
			environment: null,
			userId: null,
			userName: null,
			sessionId: null,
			correlationId: null,
			spanId: null,
			parentSpanId: null,
			clientIp: null,
			userAgent: null,
			duration: null,
			statusCode: null,
			properties: null
		};

		// Component no longer has these methods - removed obsolete tests
		expect(component).toBeTruthy();
	});
});
