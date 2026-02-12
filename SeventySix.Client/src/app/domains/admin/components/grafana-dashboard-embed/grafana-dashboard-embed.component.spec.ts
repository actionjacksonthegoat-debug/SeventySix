import { provideZonelessChangeDetection, signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { ThemeBrightness } from "@shared/models/theme.model";
import { ThemeService } from "@shared/services";
import { GrafanaDashboardEmbedComponent } from "./grafana-dashboard-embed.component";

describe("GrafanaDashboardEmbedComponent",
	() =>
	{
		let component: GrafanaDashboardEmbedComponent;
		let fixture: ComponentFixture<GrafanaDashboardEmbedComponent>;
		const mockBrightness: WritableSignal<ThemeBrightness> =
			signal<ThemeBrightness>("dark");

		const mockThemeService: Partial<ThemeService> =
			{
				brightness: mockBrightness
			};

		beforeEach(
			async () =>
			{
				mockBrightness.set("dark");

				await TestBed
					.configureTestingModule(
						{
							imports: [GrafanaDashboardEmbedComponent],
							providers: [
								provideZonelessChangeDetection(),
								{
									provide: ThemeService,
									useValue: mockThemeService
								}
							]
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
					.toContain(`${environment.observability.grafanaUrl}/d/test-dashboard`);
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
				mockBrightness.set("light");
				fixture.detectChanges();

				const url: string =
					component
						.sanitizedUrl()
						.toString();
				expect(url)
					.toContain("theme=light");
			});

		it("should reactively update theme when brightness changes",
			() =>
			{
				expect(
					component
						.sanitizedUrl()
						.toString())
					.toContain("theme=dark");

				mockBrightness.set("light");
				fixture.detectChanges();

				expect(
					component
						.sanitizedUrl()
						.toString())
					.toContain("theme=light");
			});

		it("should render iframe with fetchpriority='low' for LCP optimization",
			() =>
			{
				const iframe: HTMLIFrameElement =
					fixture.nativeElement.querySelector("iframe");

				expect(iframe)
					.toBeTruthy();
				expect(iframe.getAttribute("fetchpriority"))
					.toBe("low");
				expect(iframe.getAttribute("loading"))
					.toBe("lazy");
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
			});
	});
