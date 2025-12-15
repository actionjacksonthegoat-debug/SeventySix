import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GrafanaDashboardEmbedComponent } from "./grafana-dashboard-embed.component";

describe("GrafanaDashboardEmbedComponent",
	() =>
	{
		let component: GrafanaDashboardEmbedComponent;
		let fixture: ComponentFixture<GrafanaDashboardEmbedComponent>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [GrafanaDashboardEmbedComponent],
							providers: [provideZonelessChangeDetection()]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(GrafanaDashboardEmbedComponent);
				component =
					fixture.componentInstance;

				// Set required inputs
				fixture.componentRef.setInput("dashboardUid", "test-dashboard");

				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should generate correct Grafana URL",
			() =>
			{
				const url: string =
					component
						.sanitizedUrl()
						.toString();

				expect(url)
					.toContain("http://localhost:3000/d/test-dashboard");
				expect(url)
					.toContain("refresh=30s");
				expect(url)
					.toContain("theme=dark");
				expect(url)
					.toContain("kiosk");
			});

		it("should use custom refresh interval",
			() =>
			{
				fixture.componentRef.setInput("refreshInterval", "30s");
				fixture.detectChanges();

				const url: string =
					component
						.sanitizedUrl()
						.toString();
				expect(url)
					.toContain("refresh=30s");
			});

		it("should use custom theme",
			() =>
			{
				fixture.componentRef.setInput("theme", "light");
				fixture.detectChanges();

				const url: string =
					component
						.sanitizedUrl()
						.toString();
				expect(url)
					.toContain("theme=light");
			});

		it("should have default loading state as false",
			() =>
			{
				expect(component.isLoading())
					.toBe(false);
			});

		it("should use default title when not provided",
			() =>
			{
				expect(component.title())
					.toBe("Dashboard");
			});

		it("should use custom title when provided",
			() =>
			{
				fixture.componentRef.setInput("title", "System Health");
				fixture.detectChanges();

				expect(component.title())
					.toBe("System Health");
			});

		it("should use default height when not provided",
			() =>
			{
				expect(component.height())
					.toBe("600px");
			});

		it("should use custom height when provided",
			() =>
			{
				fixture.componentRef.setInput("height", "800px");
				fixture.detectChanges();

				expect(component.height())
					.toBe("800px");
			});

		describe("Accessibility",
			() =>
			{
				it("should have accessible title on iframe",
					() =>
					{
						fixture.componentRef.setInput("title", "System Overview");
						fixture.detectChanges();

						const iframe: HTMLIFrameElement =
							fixture.nativeElement.querySelector("iframe");

						expect(iframe.title)
							.toBe("System Overview dashboard");
					});

				it("should have role=status on loading container when loading",
					() =>
					{
						// Force loading state by setting input
						fixture.componentRef.setInput("isLoading", true);
						fixture.detectChanges();

						const loadingContainer: HTMLElement =
							fixture.nativeElement.querySelector(".loading-container");

						expect(loadingContainer)
							.toBeTruthy();
						expect(loadingContainer.getAttribute("role"))
							.toBe("status");
						expect(loadingContainer.getAttribute("aria-live"))
							.toBe("polite");
					});

				it("should have visually hidden loading text for screen readers",
					() =>
					{
						fixture.componentRef.setInput("isLoading", true);
						fixture.detectChanges();

						const loadingText: HTMLElement =
							fixture.nativeElement.querySelector(
								".loading-container .visually-hidden");

						expect(loadingText)
							.toBeTruthy();
						expect(loadingText.textContent)
							.toContain("Loading");
					});

				it("should have aria-label on progress spinner",
					() =>
					{
						fixture.componentRef.setInput("isLoading", true);
						fixture.detectChanges();

						const spinner: HTMLElement =
							fixture.nativeElement.querySelector(
								"mat-progress-spinner");

						expect(spinner.getAttribute("aria-label"))
							.toBe(
								"Loading dashboard");
					});
			});
	});
