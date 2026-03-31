import { TanStackDashboardService } from "@admin/tanstack/services";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { vi } from "vitest";
import { TanStackDashboardPage } from "./tanstack-dashboard";

describe("TanStackDashboardPage",
	() =>
	{
		let component: TanStackDashboardPage;
		let fixture: ComponentFixture<TanStackDashboardPage>;

		interface MockDashboardService
		{
			getDashboardUid: ReturnType<typeof vi.fn>;
		}

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
										? "tanstack-perf"
										: "tanstack-commerce")
					};

				await TestBed
					.configureTestingModule(
						{
							imports: [TanStackDashboardPage],
							providers: [
								provideZonelessChangeDetection(),
								provideHttpClient(),
								provideHttpClientTesting(),
								provideRouter([]),
								{
									provide: TanStackDashboardService,
									useValue: dashboardServiceSpy
								}
							]
						})
					.compileComponents();
			});

		function createComponent(): void
		{
			fixture =
				TestBed.createComponent(TanStackDashboardPage);
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

		it("should have performance dashboard UID",
			() =>
			{
				createComponent();

				expect(component.performanceDashboardUid)
					.toBe("tanstack-perf");
			});

		it("should have commerce dashboard UID",
			() =>
			{
				createComponent();

				expect(component.commerceDashboardUid)
					.toBe("tanstack-commerce");
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