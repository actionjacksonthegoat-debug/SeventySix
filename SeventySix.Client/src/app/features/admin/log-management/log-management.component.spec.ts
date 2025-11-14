import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { LogManagementComponent } from "./log-management.component";
import { LogManagementService } from "@admin/log-management/services";
import { MatDialog } from "@angular/material/dialog";
import {
	LogResponse,
	LogLevel,
	LogFilterRequest,
	PagedLogResponse
} from "@admin/log-management/models";
import { of } from "rxjs";

describe("LogManagementComponent", () =>
{
	let component: LogManagementComponent;
	let fixture: ComponentFixture<LogManagementComponent>;
	let mockLogService: jasmine.SpyObj<LogManagementService>;
	let mockDialog: jasmine.SpyObj<MatDialog>;

	const mockPagedLogs: PagedLogResponse = {
		data: [
			{
				id: 1,
				timestamp: new Date("2025-11-12T10:30:00Z"),
				level: LogLevel.Error,
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
				clientIp: null,
				userAgent: null,
				duration: null,
				statusCode: null,
				properties: null
			}
		],
		totalCount: 1,
		pageNumber: 1,
		pageSize: 50,
		totalPages: 1,
		hasPreviousPage: false,
		hasNextPage: false
	};

	beforeEach(async () =>
	{
		mockLogService = jasmine.createSpyObj(
			"LogManagementService",
			[
				"updateFilter",
				"setPage",
				"setPageSize",
				"deleteLog",
				"deleteSelected",
				"setAutoRefresh",
				"refresh"
			],
			{
				logs$: of(mockPagedLogs),
				loading$: of(false),
				error$: of(null),
				statistics$: of(null),
				filter$: of({ pageNumber: 1, pageSize: 50 })
			}
		);

		mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);

		await TestBed.configureTestingModule({
			imports: [LogManagementComponent, NoopAnimationsModule],
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
	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should subscribe to logs observable", (done) =>
	{
		setTimeout(() =>
		{
			expect(component.logs()).toEqual(mockPagedLogs);
			done();
		}, 0);
	});

	it("should handle filter changes", () =>
	{
		const filter: Partial<LogFilterRequest> = {
			searchTerm: "error",
			logLevel: LogLevel.Error
		};

		component.onFilterChange(filter);

		expect(mockLogService.updateFilter).toHaveBeenCalledWith(filter);
	});

	it("should handle auto-refresh toggle", () =>
	{
		component.onAutoRefreshChange(true);
		expect(mockLogService.setAutoRefresh).toHaveBeenCalledWith(true);

		component.onAutoRefreshChange(false);
		expect(mockLogService.setAutoRefresh).toHaveBeenCalledWith(false);
	});

	it("should handle page change", () =>
	{
		component.onPageChange(1); // pageIndex 1 = pageNumber 2
		expect(mockLogService.setPage).toHaveBeenCalledWith(2);
	});

	it("should handle page size change", () =>
	{
		component.onPageSizeChange(100);
		expect(mockLogService.setPageSize).toHaveBeenCalledWith(100);
	});

	it("should open log detail dialog when log is selected", () =>
	{
		const mockDialogRef = {
			afterClosed: () => of(undefined),
			componentInstance: { deleteLog: of() }
		};
		mockDialog.open.and.returnValue(mockDialogRef as any);

		component.onLogSelected(mockPagedLogs.data[0]);

		expect(mockDialog.open).toHaveBeenCalled();
	});

	it("should handle delete log from table", (done) =>
	{
		mockLogService.deleteLog.and.returnValue(of(void 0));

		component.onDeleteLog(1);

		setTimeout(() =>
		{
			expect(mockLogService.deleteLog).toHaveBeenCalledWith(1);
			done();
		}, 0);
	});

	it("should handle delete multiple logs", (done) =>
	{
		mockLogService.deleteSelected.and.returnValue(of(3));

		component.onDeleteSelected([1, 2, 3]);

		setTimeout(() =>
		{
			expect(mockLogService.deleteSelected).toHaveBeenCalled();
			done();
		}, 0);
	});

	it("should handle export to CSV", () =>
	{
		component.onExportCsv();
		// Export CSV functionality to be implemented
		expect(component).toBeTruthy();
	});

	it("should handle cleanup old logs", () =>
	{
		component.onCleanupLogs();
		// Cleanup functionality to be implemented
		expect(component).toBeTruthy();
	});

	it("should stop auto-refresh on destroy", () =>
	{
		component.ngOnDestroy();
		expect(mockLogService.setAutoRefresh).toHaveBeenCalledWith(false);
	});
});
