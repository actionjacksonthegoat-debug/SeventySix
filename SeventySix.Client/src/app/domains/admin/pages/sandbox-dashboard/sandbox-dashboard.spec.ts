import { PagedResultOfLogDto } from "@admin/logs/models";
import { SandboxDashboardService } from "@admin/services/sandbox-dashboard.service";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { createMockQueryResult } from "@shared/testing";
import { vi } from "vitest";
import { SandboxDashboardPage } from "./sandbox-dashboard";

describe("SandboxDashboardPage",
	() =>
	{
		let component: SandboxDashboardPage;
		let fixture: ComponentFixture<SandboxDashboardPage>;

		interface MockSandboxDashboardService
		{
			getSvelteKitWarnings: ReturnType<typeof vi.fn>;
			getSvelteKitErrors: ReturnType<typeof vi.fn>;
			getTanStackWarnings: ReturnType<typeof vi.fn>;
			getTanStackErrors: ReturnType<typeof vi.fn>;
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
				const dashboardServiceSpy: MockSandboxDashboardService =
					{
						getSvelteKitWarnings: vi
							.fn()
							.mockReturnValue(
								createMockQueryResult<PagedResultOfLogDto>(
									{ ...mockPagedResult, totalCount: 3 })),
						getSvelteKitErrors: vi
							.fn()
							.mockReturnValue(
								createMockQueryResult<PagedResultOfLogDto>(
									{ ...mockPagedResult, totalCount: 1 })),
						getTanStackWarnings: vi
							.fn()
							.mockReturnValue(
								createMockQueryResult<PagedResultOfLogDto>(
									{ ...mockPagedResult, totalCount: 7 })),
						getTanStackErrors: vi
							.fn()
							.mockReturnValue(
								createMockQueryResult<PagedResultOfLogDto>(
									{ ...mockPagedResult, totalCount: 2 }))
					};

				await TestBed
					.configureTestingModule(
						{
							imports: [SandboxDashboardPage],
							providers: [
								provideZonelessChangeDetection(),
								provideHttpClient(),
								provideHttpClientTesting(),
								provideRouter([]),
								{
									provide: SandboxDashboardService,
									useValue: dashboardServiceSpy
								}
							]
						})
					.compileComponents();
			});

		function createComponent(): void
		{
			fixture =
				TestBed.createComponent(SandboxDashboardPage);
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

		it("should display SvelteKit warning count",
			() =>
			{
				createComponent();

				expect(component.svelteKitWarningCount())
					.toBe(3);
			});

		it("should display SvelteKit error count",
			() =>
			{
				createComponent();

				expect(component.svelteKitErrorCount())
					.toBe(1);
			});

		it("should display TanStack warning count",
			() =>
			{
				createComponent();

				expect(component.tanStackWarningCount())
					.toBe(7);
			});

		it("should display TanStack error count",
			() =>
			{
				createComponent();

				expect(component.tanStackErrorCount())
					.toBe(2);
			});

		it("should not be loading when queries are complete",
			() =>
			{
				createComponent();

				expect(component.isLoading())
					.toBe(false);
			});

		it("should render sandbox cards",
			() =>
			{
				createComponent();

				const compiled: HTMLElement =
					fixture.nativeElement as HTMLElement;

				expect(compiled.querySelector("[data-testid='sveltekit-card']"))
					.toBeTruthy();
				expect(compiled.querySelector("[data-testid='tanstack-card']"))
					.toBeTruthy();
			});

		it("should expose source context identifiers",
			() =>
			{
				createComponent();

				expect(component.svelteKitSource)
					.toBe("seventysixcommerce-sveltekit");
				expect(component.tanStackSource)
					.toBe("seventysixcommerce-tanstack");
			});
	});