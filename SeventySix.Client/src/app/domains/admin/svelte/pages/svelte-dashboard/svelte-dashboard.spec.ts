import { PagedResultOfLogDto } from "@admin/logs/models";
import { SvelteDashboardService } from "@admin/svelte/services";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { createMockQueryResult } from "@shared/testing";
import { vi } from "vitest";
import { SvelteDashboardPage } from "./svelte-dashboard";

describe("SvelteDashboardPage",
	() =>
	{
		let component: SvelteDashboardPage;
		let fixture: ComponentFixture<SvelteDashboardPage>;

		interface MockDashboardService
		{
			getDashboardUid: ReturnType<typeof vi.fn>;
			getWarnings: ReturnType<typeof vi.fn>;
			getErrors: ReturnType<typeof vi.fn>;
		}

		const mockPagedResult: PagedResultOfLogDto =
			{
				items: [],
				page: 1,
				pageSize: 1,
				totalCount: 5,
				totalPages: 5
			};

		beforeEach(
			async () =>
			{
				const dashboardServiceSpy: MockDashboardService =
					{
						getDashboardUid: vi
							.fn()
							.mockImplementation(
								(type: string) =>
									type === "performance"
										? "svelte-perf"
										: "svelte-commerce"),
						getWarnings: vi
							.fn()
							.mockReturnValue(
								createMockQueryResult<PagedResultOfLogDto>(
									{ ...mockPagedResult, totalCount: 4 })),
						getErrors: vi
							.fn()
							.mockReturnValue(
								createMockQueryResult<PagedResultOfLogDto>(
									{ ...mockPagedResult, totalCount: 2 }))
					};

				await TestBed
					.configureTestingModule(
						{
							imports: [SvelteDashboardPage],
							providers: [
								provideZonelessChangeDetection(),
								provideHttpClient(),
								provideHttpClientTesting(),
								provideRouter([]),
								{
									provide: SvelteDashboardService,
									useValue: dashboardServiceSpy
								}
							]
						})
					.compileComponents();
			});

		function createComponent(): void
		{
			fixture =
				TestBed.createComponent(SvelteDashboardPage);
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

		it("should display warning count",
			() =>
			{
				createComponent();

				expect(component.warningCount())
					.toBe(4);
			});

		it("should display error count",
			() =>
			{
				createComponent();

				expect(component.errorCount())
					.toBe(2);
			});

		it("should not be loading when queries are complete",
			() =>
			{
				createComponent();

				expect(component.isLoading())
					.toBe(false);
			});

		it("should have performance dashboard UID",
			() =>
			{
				createComponent();

				expect(component.performanceDashboardUid)
					.toBe("svelte-perf");
			});

		it("should have commerce dashboard UID",
			() =>
			{
				createComponent();

				expect(component.commerceDashboardUid)
					.toBe("svelte-commerce");
			});

		it("should render Grafana embed components",
			() =>
			{
				createComponent();

				const compiled: HTMLElement =
					fixture.nativeElement as HTMLElement;
				expect(compiled.querySelector("app-grafana-dashboard-embed"))
					.toBeTruthy();
			});
	});