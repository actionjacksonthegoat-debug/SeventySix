import { SvelteDashboardService } from "@admin/svelte/services";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
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
										? "svelte-perf"
										: "svelte-commerce")
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