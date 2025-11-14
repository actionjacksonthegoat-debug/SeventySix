import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { CurrentWeather } from "@home/weather/models";
import { WeatherDetailsComponent } from "./weather-details.component";

describe("WeatherDetailsComponent", () =>
{
	let component: WeatherDetailsComponent;
	let fixture: ComponentFixture<WeatherDetailsComponent>;

	const mockCurrentWeather: CurrentWeather = {
		dt: 1699747200,
		sunrise: 1699707600,
		sunset: 1699743600,
		temp: 15.5,
		feels_like: 14.2,
		pressure: 1013,
		humidity: 65,
		dew_point: 9.0,
		clouds: 40,
		uvi: 2.5,
		visibility: 10000,
		wind_speed: 3.5,
		wind_deg: 180,
		weather: [
			{
				id: 801,
				main: "Clouds",
				description: "few clouds",
				icon: "02d"
			}
		]
	};

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [WeatherDetailsComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(WeatherDetailsComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should accept current weather input", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		expect(component.currentWeather()).toEqual(mockCurrentWeather);
	});

	it("should display UV index", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const uviElement = compiled.querySelector(".detail-uvi .detail-value");
		expect(uviElement?.textContent).toContain("2.5");
	});

	it("should display humidity", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const humidityElement = compiled.querySelector(
			".detail-humidity .detail-value"
		);
		expect(humidityElement?.textContent).toContain("65%");
	});

	it("should display wind speed", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const windElement = compiled.querySelector(
			".detail-wind .detail-value"
		);
		expect(windElement?.textContent).toContain("3.5");
	});

	it("should display wind direction", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const windElement = compiled.querySelector(
			".detail-wind .detail-value"
		);
		expect(windElement?.textContent).toContain("S");
	});

	it("should display pressure", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const pressureElement = compiled.querySelector(
			".detail-pressure .detail-value"
		);
		expect(pressureElement?.textContent).toContain("1013");
	});

	it("should display visibility", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const visibilityElement = compiled.querySelector(
			".detail-visibility .detail-value"
		);
		expect(visibilityElement?.textContent).toContain("10");
	});

	it("should display sunrise time", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const sunriseElement = compiled.querySelector(
			".detail-sunrise .detail-value"
		);
		expect(sunriseElement?.textContent).toMatch(/\d{1,2}:\d{2}/);
	});

	it("should display sunset time", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const sunsetElement = compiled.querySelector(
			".detail-sunset .detail-value"
		);
		expect(sunsetElement?.textContent).toMatch(/\d{1,2}:\d{2}/);
	});

	it("should format wind direction correctly", () =>
	{
		expect(component.formatWindDirection(0)).toBe("N");
		expect(component.formatWindDirection(90)).toBe("E");
		expect(component.formatWindDirection(180)).toBe("S");
		expect(component.formatWindDirection(270)).toBe("W");
		expect(component.formatWindDirection(45)).toBe("NE");
		expect(component.formatWindDirection(135)).toBe("SE");
		expect(component.formatWindDirection(225)).toBe("SW");
		expect(component.formatWindDirection(315)).toBe("NW");
	});

	it("should format time correctly", () =>
	{
		const formatted = component.formatTime(1699707600);
		expect(formatted).toMatch(/^\d{1,2}:\d{2}\s*(AM|PM)$/);
	});

	it("should format visibility in kilometers", () =>
	{
		const formatted = component.formatVisibility(10000);
		expect(formatted).toBe("10 km");
	});

	it("should use grid layout", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const grid = compiled.querySelector(".details-grid");
		expect(grid).toBeTruthy();
	});

	it("should display detail icons", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const icons = compiled.querySelectorAll(".detail-icon mat-icon");
		expect(icons.length).toBeGreaterThan(0);
	});

	it("should show empty state when no data provided", () =>
	{
		fixture.componentRef.setInput("currentWeather", undefined);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const emptyState = compiled.querySelector(".empty-state");
		expect(emptyState).toBeTruthy();
	});

	it("should display all detail cards", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const detailCards = compiled.querySelectorAll(".detail-card");
		expect(detailCards.length).toBe(8); // UV, Humidity, Wind, Pressure, Visibility, Sunrise, Sunset, Dew Point
	});

	it("should display dew point", () =>
	{
		fixture.componentRef.setInput("currentWeather", mockCurrentWeather);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const dewPointElement = compiled.querySelector(
			".detail-dewpoint .detail-value"
		);
		expect(dewPointElement?.textContent).toContain("9.0");
	});
});
