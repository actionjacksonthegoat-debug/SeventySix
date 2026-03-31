import { PagedResultOfLogDto } from "@admin/logs/models";
import { TanStackLogService } from "@admin/tanstack/services";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { createMockQueryResult } from "@shared/testing";
import { vi } from "vitest";
import { TanStackLogsPage } from "./tanstack-logs";

describe("TanStackLogsPage",
	() =>
	{
		let component: TanStackLogsPage;
		let fixture: ComponentFixture<TanStackLogsPage>;

		interface MockLogService
		{
			getPagedLogs: ReturnType<typeof vi.fn>;
			currentPage: ReturnType<typeof signal<number>>;
			pageSize: ReturnType<typeof signal<number>>;
			logLevelFilter: ReturnType<typeof signal<string>>;
			goToPage: ReturnType<typeof vi.fn>;
			setLevelFilter: ReturnType<typeof vi.fn>;
		}

		const mockPagedResult: PagedResultOfLogDto =
			{
				items: [
					{
						id: 1,
						logLevel: "Warning",
						message: "Test warning message",
						exceptionMessage: null,
						baseExceptionMessage: null,
						stackTrace: null,
						sourceContext: "seventysixcommerce-tanstack",
						requestMethod: null,
						requestPath: null,
						statusCode: null,
						durationMs: null,
						properties: null,
						createDate: "2026-01-15T12:00:00.000Z",
						machineName: null,
						environment: null,
						correlationId: null,
						spanId: null,
						parentSpanId: null
					}
				],
				page: 1,
				pageSize: 25,
				totalCount: 1,
				totalPages: 1
			};

		let logServiceSpy: MockLogService;

		beforeEach(
			async () =>
			{
				logServiceSpy =
					{
						getPagedLogs: vi
							.fn()
							.mockReturnValue(
								createMockQueryResult<PagedResultOfLogDto>(mockPagedResult)),
						currentPage: signal<number>(1),
						pageSize: signal<number>(25),
						logLevelFilter: signal<string>(""),
						goToPage: vi.fn(),
						setLevelFilter: vi.fn()
					};

				await TestBed
					.configureTestingModule(
						{
							imports: [TanStackLogsPage],
							providers: [
								provideZonelessChangeDetection(),
								provideHttpClient(),
								provideHttpClientTesting(),
								provideRouter([]),
								{
									provide: TanStackLogService,
									useValue: logServiceSpy
								}
							]
						})
					.compileComponents();
			});

		function createComponent(): void
		{
			fixture =
				TestBed.createComponent(TanStackLogsPage);
			component =
				fixture.componentInstance;
			fixture.detectChanges();
		}

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		it("should create",
			() =>
			{
				createComponent();

				expect(component)
					.toBeTruthy();
			});

		it("should render page header",
			() =>
			{
				createComponent();

				const compiled: HTMLElement =
					fixture.nativeElement as HTMLElement;
				expect(compiled.querySelector("app-page-header"))
					.toBeTruthy();
			});

		it("should not be loading when query is complete",
			() =>
			{
				createComponent();

				expect(component.isLoading())
					.toBe(false);
			});

		it("should display total count from query result",
			() =>
			{
				createComponent();

				expect(component.totalCount())
					.toBe(1);
			});

		it("should expose page size from service",
			() =>
			{
				createComponent();

				expect(component.pageSize())
					.toBe(25);
			});

		it("should have page index of 0 for first page",
			() =>
			{
				createComponent();

				expect(component.pageIndex())
					.toBe(0);
			});

		it("should call goToPage on page change",
			() =>
			{
				createComponent();

				component.onPageChange(
					{ pageIndex: 2, pageSize: 25, length: 100 });

				expect(logServiceSpy.goToPage)
					.toHaveBeenCalledWith(3);
			});

		it("should call setLevelFilter on level change",
			() =>
			{
				createComponent();

				component.onLevelChange("Warning");

				expect(logServiceSpy.setLevelFilter)
					.toHaveBeenCalledWith("Warning");
			});

		it("should render log table",
			() =>
			{
				createComponent();

				const compiled: HTMLElement =
					fixture.nativeElement as HTMLElement;
				expect(compiled.querySelector(".log-table"))
					.toBeTruthy();
			});

		it("should render paginator",
			() =>
			{
				createComponent();

				const compiled: HTMLElement =
					fixture.nativeElement as HTMLElement;
				expect(compiled.querySelector("mat-paginator"))
					.toBeTruthy();
			});
	});