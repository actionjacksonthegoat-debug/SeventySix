import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GrafanaDashboardEmbedComponent } from "./grafana-dashboard-embed.component";
import { provideZonelessChangeDetection } from "@angular/core";

describe("GrafanaDashboardEmbedComponent", () =>
{
	let component: GrafanaDashboardEmbedComponent;
	let fixture: ComponentFixture<GrafanaDashboardEmbedComponent>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [GrafanaDashboardEmbedComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(GrafanaDashboardEmbedComponent);
		component = fixture.componentInstance;

		// Set required inputs
		fixture.componentRef.setInput("dashboardUid", "test-dashboard");

		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should generate correct Grafana URL", () =>
	{
		const url: string = component.sanitizedUrl().toString();

		expect(url).toContain("http://localhost:3000/d/test-dashboard");
		expect(url).toContain("refresh=5s");
		expect(url).toContain("theme=dark");
		expect(url).toContain("kiosk");
	});

	it("should use custom refresh interval", () =>
	{
		fixture.componentRef.setInput("refreshInterval", "30s");
		fixture.detectChanges();

		const url: string = component.sanitizedUrl().toString();
		expect(url).toContain("refresh=30s");
	});

	it("should use custom theme", () =>
	{
		fixture.componentRef.setInput("theme", "light");
		fixture.detectChanges();

		const url: string = component.sanitizedUrl().toString();
		expect(url).toContain("theme=light");
	});

	it("should have default loading state as false", () =>
	{
		expect(component.isLoading()).toBe(false);
	});

	it("should use default title when not provided", () =>
	{
		expect(component.title()).toBe("Dashboard");
	});

	it("should use custom title when provided", () =>
	{
		fixture.componentRef.setInput("title", "System Health");
		fixture.detectChanges();

		expect(component.title()).toBe("System Health");
	});

	it("should use default height when not provided", () =>
	{
		expect(component.height()).toBe("600px");
	});

	it("should use custom height when provided", () =>
	{
		fixture.componentRef.setInput("height", "800px");
		fixture.detectChanges();

		expect(component.height()).toBe("800px");
	});
});
