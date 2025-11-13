import { TestBed } from "@angular/core/testing";
import {
	HttpClientTestingModule,
	HttpTestingController
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { LogManagementService } from "./log-management.service";
import { LogsApiService } from "./logs-api.service";
import {
	LogFilterRequest,
	PagedLogResponse,
	LogCountResponse,
	LogLevel,
	LogResponse
} from "@core/models/logs";

describe("LogManagementService", () =>
{
	let service: LogManagementService;
	let httpMock: HttpTestingController;

	const mockLogResponse: LogResponse = {
		id: 1,
		timestamp: new Date(),
		level: LogLevel.Information,
		message: "Test log",
		sourceContext: "Test",
		exception: null,
		stackTrace: null,
		requestId: null,
		requestPath: null,
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
	};

	const mockPagedResponse: PagedLogResponse = {
		data: [mockLogResponse],
		totalCount: 1,
		pageNumber: 1,
		pageSize: 50,
		totalPages: 1,
		hasPreviousPage: false,
		hasNextPage: false
	};

	const mockCountResponse: LogCountResponse = {
		total: 1
	};

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [
				provideZonelessChangeDetection(),
				LogManagementService,
				LogsApiService
			]
		});

		service = TestBed.inject(LogManagementService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() =>
	{
		// Flush any pending requests before verification
		const pendingReqs = httpMock.match(() => true);
		pendingReqs.forEach((req: any) =>
		{
			if (!req.cancelled)
			{
				if (req.request.url.includes("count"))
				{
					req.flush({ total: 0 });
				}
				else
				{
					req.flush({
						data: [],
						totalCount: 0,
						pageNumber: 1,
						pageSize: 50,
						totalPages: 0,
						hasPreviousPage: false,
						hasNextPage: false
					});
				}
			}
		});

		httpMock.verify();
		TestBed.resetTestingModule();
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	it("should initialize with default filter", (done: DoneFn) =>
	{
		service.filter$.subscribe((filter: LogFilterRequest) =>
		{
			expect(filter.pageNumber).toBe(1);
			expect(filter.pageSize).toBe(50);
			done();
		});
	});

	it("should initialize with loading false", (done: DoneFn) =>
	{
		service.loading$.subscribe((loading: boolean) =>
		{
			expect(loading).toBe(false);
			done();
		});
	});

	it("should initialize with no error", (done: DoneFn) =>
	{
		service.error$.subscribe((error: string | null) =>
		{
			expect(error).toBeNull();
			done();
		});
	});

	it("should initialize with empty selection", (done: DoneFn) =>
	{
		service.selectedIds$.subscribe((ids: Set<number>) =>
		{
			expect(ids.size).toBe(0);
			done();
		});
	});

	it("should update filter and reset to page 1", (done: DoneFn) =>
	{
		// Initial load happens automatically
		setTimeout(() =>
		{
			const reqs = httpMock.match(() => true);
			reqs.forEach((req: any) =>
			{
				if (req.request.url.includes("count"))
				{
					req.flush(mockCountResponse);
				}
				else
				{
					req.flush(mockPagedResponse);
				}
			});

			service.updateFilter({ logLevel: LogLevel.Error });

			setTimeout(() =>
			{
				service.filter$.subscribe((filter: LogFilterRequest) =>
				{
					expect(filter.logLevel).toBe(LogLevel.Error);
					expect(filter.pageNumber).toBe(1);

					const reqs2 = httpMock.match(() => true);
					reqs2.forEach((req: any) =>
					{
						if (req.request.url.includes("count"))
						{
							req.flush(mockCountResponse);
						}
						else
						{
							req.flush(mockPagedResponse);
						}
					});
					done();
				});
			}, 500);
		}, 500);
	});

	it("should set page number", (done: DoneFn) =>
	{
		setTimeout(() =>
		{
			const reqs = httpMock.match(() => true);
			reqs.forEach((req: any) =>
			{
				if (req.request.url.includes("count"))
				{
					req.flush(mockCountResponse);
				}
				else
				{
					req.flush(mockPagedResponse);
				}
			});

			service.setPage(2);

			setTimeout(() =>
			{
				service.filter$.subscribe((filter: LogFilterRequest) =>
				{
					expect(filter.pageNumber).toBe(2);

					const reqs2 = httpMock.match(() => true);
					reqs2.forEach((req: any) =>
					{
						if (req.request.url.includes("count"))
						{
							req.flush(mockCountResponse);
						}
						else
						{
							req.flush(mockPagedResponse);
						}
					});
					done();
				});
			}, 500);
		}, 500);
	});

	it("should set page size and reset to page 1", (done: DoneFn) =>
	{
		setTimeout(() =>
		{
			const reqs = httpMock.match(() => true);
			reqs.forEach((req: any) =>
			{
				if (req.request.url.includes("count"))
				{
					req.flush(mockCountResponse);
				}
				else
				{
					req.flush(mockPagedResponse);
				}
			});

			service.setPageSize(100);

			setTimeout(() =>
			{
				service.filter$.subscribe((filter: LogFilterRequest) =>
				{
					expect(filter.pageSize).toBe(100);
					expect(filter.pageNumber).toBe(1);

					const reqs2 = httpMock.match(() => true);
					reqs2.forEach((req: any) =>
					{
						if (req.request.url.includes("count"))
						{
							req.flush(mockCountResponse);
						}
						else
						{
							req.flush(mockPagedResponse);
						}
					});
					done();
				});
			}, 500);
		}, 500);
	});

	it("should clear filters", (done: DoneFn) =>
	{
		setTimeout(() =>
		{
			const reqs = httpMock.match(() => true);
			reqs.forEach((req: any) =>
			{
				if (req.request.url.includes("count"))
				{
					req.flush(mockCountResponse);
				}
				else
				{
					req.flush(mockPagedResponse);
				}
			});

			service.updateFilter({
				logLevel: LogLevel.Error,
				startDate: new Date()
			});

			setTimeout(() =>
			{
				const reqs2 = httpMock.match(() => true);
				reqs2.forEach((req: any) =>
				{
					if (req.request.url.includes("count"))
					{
						req.flush(mockCountResponse);
					}
					else
					{
						req.flush(mockPagedResponse);
					}
				});

				service.clearFilters();

				setTimeout(() =>
				{
					service.filter$.subscribe((filter: LogFilterRequest) =>
					{
						expect(filter.logLevel).toBeUndefined();
						expect(filter.startDate).toBeUndefined();
						expect(filter.pageNumber).toBe(1);

						const reqs3 = httpMock.match(() => true);
						reqs3.forEach((req: any) =>
						{
							if (req.request.url.includes("count"))
							{
								req.flush(mockCountResponse);
							}
							else
							{
								req.flush(mockPagedResponse);
							}
						});
						done();
					});
				}, 500);
			}, 500);
		}, 500);
	});

	it("should toggle selection", (done: DoneFn) =>
	{
		service.toggleSelection(1);

		setTimeout(() =>
		{
			service.selectedIds$.subscribe((ids: Set<number>) =>
			{
				expect(ids.has(1)).toBe(true);
				done();
			});
		}, 100);
	});

	it("should toggle selection off", (done: DoneFn) =>
	{
		service.toggleSelection(1);

		setTimeout(() =>
		{
			service.toggleSelection(1);

			setTimeout(() =>
			{
				service.selectedIds$.subscribe((ids: Set<number>) =>
				{
					expect(ids.has(1)).toBe(false);
					done();
				});
			}, 100);
		}, 100);
	});

	it("should select all visible logs", (done: DoneFn) =>
	{
		setTimeout(() =>
		{
			const reqs = httpMock.match(() => true);
			reqs.forEach((req: any) =>
			{
				if (req.request.url.includes("count"))
				{
					req.flush(mockCountResponse);
				}
				else
				{
					req.flush(mockPagedResponse);
				}
			});

			setTimeout(() =>
			{
				service.selectAll();

				setTimeout(() =>
				{
					service.selectedIds$.subscribe((ids: Set<number>) =>
					{
						expect(ids.size).toBe(1);
						expect(ids.has(1)).toBe(true);
						done();
					});
				}, 100);
			}, 500);
		}, 500);
	});

	it("should clear selection", (done: DoneFn) =>
	{
		service.toggleSelection(1);

		setTimeout(() =>
		{
			service.clearSelection();

			setTimeout(() =>
			{
				service.selectedIds$.subscribe((ids: Set<number>) =>
				{
					expect(ids.size).toBe(0);
					done();
				});
			}, 100);
		}, 100);
	});

	it("should refresh data", (done: DoneFn) =>
	{
		setTimeout(() =>
		{
			const reqs = httpMock.match(() => true);
			reqs.forEach((req: any) =>
			{
				if (req.request.url.includes("count"))
				{
					req.flush(mockCountResponse);
				}
				else
				{
					req.flush(mockPagedResponse);
				}
			});

			service.refresh();

			setTimeout(() =>
			{
				const reqs2 = httpMock.match(() => true);
				expect(reqs2.length).toBeGreaterThan(0);
				reqs2.forEach((req: any) =>
				{
					if (req.request.url.includes("count"))
					{
						req.flush(mockCountResponse);
					}
					else
					{
						req.flush(mockPagedResponse);
					}
				});
				done();
			}, 500);
		}, 500);
	});

	it("should set auto-refresh", (done: DoneFn) =>
	{
		service.setAutoRefresh(true);

		setTimeout(() =>
		{
			service.autoRefresh$.subscribe((enabled: boolean) =>
			{
				expect(enabled).toBe(true);
				done();
			});
		}, 100);
	});

	it("should get current filter value", () =>
	{
		const filter = service.getCurrentFilter();
		expect(filter.pageNumber).toBe(1);
		expect(filter.pageSize).toBe(50);
	});

	it("should get current logs value", () =>
	{
		const logs = service.getCurrentLogs();
		expect(logs).toBeNull();
	});

	it("should get current selected IDs", () =>
	{
		const ids = service.getSelectedIds();
		expect(ids.size).toBe(0);
	});
});
