import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { WeatherAlert } from "@home/weather/models";
import { WeatherAlertsComponent } from "./weather-alerts.component";

describe("WeatherAlertsComponent", () =>
{
	let component: WeatherAlertsComponent;
	let fixture: ComponentFixture<WeatherAlertsComponent>;

	const mockAlerts: WeatherAlert[] = [
		{
			sender_name: "National Weather Service",
			event: "Winter Storm Warning",
			start: 1699747200,
			end: 1699790400,
			description:
				"Heavy snow expected. Total snow accumulations of 6 to 12 inches.",
			tags: ["Snow", "Winter"]
		},
		{
			sender_name: "National Weather Service",
			event: "Heat Advisory",
			start: 1699747200,
			end: 1699776000,
			description:
				"Dangerously hot conditions with temperatures near 100°F.",
			tags: ["Extreme temperature value"]
		}
	];

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [WeatherAlertsComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(WeatherAlertsComponent);
		component = fixture.componentInstance;

		// Clear localStorage before each test
		localStorage.clear();
	});

	afterEach(() =>
	{
		localStorage.clear();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should accept alerts input", () =>
	{
		fixture.componentRef.setInput("alerts", mockAlerts);
		expect(component.alerts()).toEqual(mockAlerts);
	});

	it("should filter out dismissed alerts", () =>
	{
		// Set alerts first
		fixture.componentRef.setInput("alerts", mockAlerts);
		fixture.detectChanges();

		// Dismiss first alert
		component.dismissAlert(0);

		expect(component.visibleAlerts().length).toBe(1);
		expect(component.visibleAlerts()[0].event).toBe("Heat Advisory");
	});

	it("should display alert banner when alerts present", () =>
	{
		fixture.componentRef.setInput("alerts", mockAlerts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const banner = compiled.querySelector(".alerts-banner");
		expect(banner).toBeTruthy();
	});

	it("should not display banner when no alerts", () =>
	{
		fixture.componentRef.setInput("alerts", []);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const banner = compiled.querySelector(".alerts-banner");
		expect(banner).toBeFalsy();
	});

	it("should display alert event name", () =>
	{
		fixture.componentRef.setInput("alerts", [mockAlerts[0]]);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const eventName = compiled.querySelector(".alert-event");
		expect(eventName?.textContent).toContain("Winter Storm Warning");
	});

	it("should display alert description", () =>
	{
		fixture.componentRef.setInput("alerts", [mockAlerts[0]]);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const description = compiled.querySelector(".alert-description");
		expect(description?.textContent).toContain("Heavy snow expected");
	});

	it("should display sender name", () =>
	{
		fixture.componentRef.setInput("alerts", [mockAlerts[0]]);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const sender = compiled.querySelector(".alert-sender");
		expect(sender?.textContent).toContain("National Weather Service");
	});

	it("should dismiss alert when close button clicked", () =>
	{
		fixture.componentRef.setInput("alerts", mockAlerts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const closeButton = compiled.querySelector(
			".alert-close"
		) as HTMLButtonElement;
		closeButton?.click();

		fixture.detectChanges();

		expect(component.visibleAlerts().length).toBe(1);
	});

	it("should persist dismissed alerts to localStorage", () =>
	{
		fixture.componentRef.setInput("alerts", mockAlerts);
		component.dismissAlert(0);

		const stored = localStorage.getItem("dismissedAlerts");
		expect(stored).toBeTruthy();

		const parsed = JSON.parse(stored!);
		expect(parsed).toContain("Winter Storm Warning_1699747200");
	});

	it("should load dismissed alerts from localStorage", () =>
	{
		// Pre-populate localStorage
		const dismissedKey = "Winter Storm Warning_1699747200";
		localStorage.setItem("dismissedAlerts", JSON.stringify([dismissedKey]));

		// Create new component instance
		fixture = TestBed.createComponent(WeatherAlertsComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput("alerts", mockAlerts);

		expect(component.visibleAlerts().length).toBe(1);
		expect(component.visibleAlerts()[0].event).toBe("Heat Advisory");
	});

	it("should determine severity from event name", () =>
	{
		expect(component.getSeverity("Winter Storm Warning")).toBe("warning");
		expect(component.getSeverity("Heat Advisory")).toBe("advisory");
		expect(component.getSeverity("Tornado Watch")).toBe("watch");
		expect(component.getSeverity("Hurricane Warning")).toBe("warning");
	});

	it("should apply correct CSS class for warning severity", () =>
	{
		fixture.componentRef.setInput("alerts", [mockAlerts[0]]);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const alertCard = compiled.querySelector(".alert-card");
		expect(alertCard?.classList.contains("severity-warning")).toBe(true);
	});

	it("should apply correct CSS class for advisory severity", () =>
	{
		fixture.componentRef.setInput("alerts", [mockAlerts[1]]);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const alertCard = compiled.querySelector(".alert-card");
		expect(alertCard?.classList.contains("severity-advisory")).toBe(true);
	});

	it("should format alert times", () =>
	{
		const formatted = component.formatAlertTime(1699747200);
		expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
	});

	it("should display formatted start and end times", () =>
	{
		fixture.componentRef.setInput("alerts", [mockAlerts[0]]);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const timeElement = compiled.querySelector(".alert-time");
		expect(timeElement?.textContent).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
	});

	it("should handle undefined alerts gracefully", () =>
	{
		fixture.componentRef.setInput("alerts", undefined);
		fixture.detectChanges();

		expect(component.visibleAlerts().length).toBe(0);
	});

	it("should display multiple alerts when present", () =>
	{
		fixture.componentRef.setInput("alerts", mockAlerts);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const alertCards = compiled.querySelectorAll(".alert-card");
		expect(alertCards.length).toBe(2);
	});

	it("should have sticky positioning", () =>
	{
		fixture.componentRef.setInput("alerts", [mockAlerts[0]]);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const banner = compiled.querySelector(".alerts-banner");
		const styles = window.getComputedStyle(banner as Element);
		expect(styles.position).toBe("sticky");
	});
});
