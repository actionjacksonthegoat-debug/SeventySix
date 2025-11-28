import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	QueryClient,
	provideTanStackQuery
} from "@tanstack/angular-query-experimental";
import { LogList } from "./log-list";
import { LogManagementService } from "@admin/logs/services";
import {
	createMockQueryResult,
	createMockMutationResult
} from "@testing/tanstack-query-helpers";
import { LogDto } from "@admin/logs/models";
import { PagedResponse } from "@infrastructure/models";

describe("LogList", () =>
{
	let component: LogList;
	let fixture: ComponentFixture<LogList>;
	let mockLogService: jasmine.SpyObj<LogManagementService>;

	beforeEach(async () =>
	{
		// Create properly typed mock query/mutation results
		const mockPagedResponse: PagedResponse<LogDto> = {
			items: [],
			totalCount: 0,
			page: 1,
			pageSize: 50,
			totalPages: 0,
			hasPrevious: false,
			hasNext: false
		};

		const mockQuery =
			createMockQueryResult<PagedResponse<LogDto>>(mockPagedResponse);
		const mockDeleteMutation = createMockMutationResult<
			void,
			Error,
			number
		>();
		const mockBatchDeleteMutation = createMockMutationResult<
			number,
			Error,
			number[]
		>();

		// Create mock service with all required methods
		mockLogService = jasmine.createSpyObj("LogManagementService", [
			"getLogs",
			"deleteLog",
			"deleteLogs",
			"updateFilter",
			"clearSelection",
			"selectAll",
			"deleteSelected"
		]);

		// Configure mock return values
		mockLogService.getLogs.and.returnValue(mockQuery);
		mockLogService.deleteLog.and.returnValue(mockDeleteMutation);
		mockLogService.deleteLogs.and.returnValue(mockBatchDeleteMutation);

		await TestBed.configureTestingModule({
			imports: [LogList],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideTanStackQuery(new QueryClient()),
				{ provide: LogManagementService, useValue: mockLogService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(LogList);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		fixture.detectChanges();
		expect(component).toBeTruthy();
	});

	it("should define column configuration", () =>
	{
		fixture.detectChanges();
		expect(component.columns).toBeDefined();
		expect(component.columns.length).toBe(6);
		expect(component.columns[0].key).toBe("logLevel");
		expect(component.columns[1].key).toBe("createDate");
	});

	it("should define quick filters", () =>
	{
		fixture.detectChanges();
		expect(component.quickFilters).toBeDefined();
		expect(component.quickFilters.length).toBe(3);
		expect(component.quickFilters[0].key).toBe("all");
		expect(component.quickFilters[1].key).toBe("warnings");
		expect(component.quickFilters[2].key).toBe("errors");
	});

	it("should define row actions", () =>
	{
		fixture.detectChanges();
		expect(component.rowActions).toBeDefined();
		expect(component.rowActions.length).toBe(1);
		expect(component.rowActions[0].key).toBe("delete");
	});

	it("should define bulk actions", () =>
	{
		fixture.detectChanges();
		expect(component.bulkActions).toBeDefined();
		expect(component.bulkActions.length).toBe(1);
		expect(component.bulkActions[0].key).toBe("delete");
	});
});
