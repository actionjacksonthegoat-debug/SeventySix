import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { WeatherPreferencesService } from "@home/weather/services/weather-preferences.service";
import { AnimatedBackgroundComponent } from "./animated-background.component";

describe("AnimatedBackgroundComponent", () =>
{
	let component: AnimatedBackgroundComponent;
	let fixture: ComponentFixture<AnimatedBackgroundComponent>;
	let preferencesService: WeatherPreferencesService;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [AnimatedBackgroundComponent],
			providers: [
				provideZonelessChangeDetection(),
				WeatherPreferencesService
			]
		}).compileComponents();

		fixture = TestBed.createComponent(AnimatedBackgroundComponent);
		component = fixture.componentInstance;
		preferencesService = TestBed.inject(WeatherPreferencesService);
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should accept weather condition input", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "Clear");
		expect(component.weatherCondition()).toBe("Clear");
	});

	it("should compute background class from weather condition", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "Clear");
		expect(component.backgroundClass()).toBe("bg-clear");
	});

	it("should map Clouds condition to bg-clouds", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "Clouds");
		expect(component.backgroundClass()).toBe("bg-clouds");
	});

	it("should map Rain condition to bg-rain", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "Rain");
		expect(component.backgroundClass()).toBe("bg-rain");
	});

	it("should map Snow condition to bg-snow", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "Snow");
		expect(component.backgroundClass()).toBe("bg-snow");
	});

	it("should map Thunderstorm condition to bg-thunderstorm", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "Thunderstorm");
		expect(component.backgroundClass()).toBe("bg-thunderstorm");
	});

	it("should map Drizzle condition to bg-drizzle", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "Drizzle");
		expect(component.backgroundClass()).toBe("bg-drizzle");
	});

	it("should map Mist/Fog to bg-mist", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "Mist");
		expect(component.backgroundClass()).toBe("bg-mist");
	});

	it("should default to bg-clear for unknown conditions", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "Unknown");
		expect(component.backgroundClass()).toBe("bg-clear");
	});

	it("should apply background class to element", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "Rain");
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const background = compiled.querySelector(".animated-background");
		expect(background?.classList.contains("bg-rain")).toBe(true);
	});

	it("should have smooth transition class", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const background = compiled.querySelector(".animated-background");
		expect(background?.classList.contains("smooth-transition")).toBe(true);
	});

	it("should respect reduced motion preference", () =>
	{
		// Set reduced motion preference
		preferencesService.updatePreferences({ animationsEnabled: false });
		fixture.detectChanges();

		expect(component.animationsEnabled()).toBe(false);
	});

	it("should apply no-animation class when animations disabled", () =>
	{
		preferencesService.updatePreferences({ animationsEnabled: false });
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const background = compiled.querySelector(".animated-background");
		expect(background?.classList.contains("no-animation")).toBe(true);
	});

	it("should not apply no-animation class when animations enabled", () =>
	{
		preferencesService.updatePreferences({ animationsEnabled: true });
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const background = compiled.querySelector(".animated-background");
		expect(background?.classList.contains("no-animation")).toBe(false);
	});

	it("should handle undefined weather condition", () =>
	{
		fixture.componentRef.setInput("weatherCondition", undefined);
		expect(component.backgroundClass()).toBe("bg-clear");
	});

	it("should handle empty weather condition", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "");
		expect(component.backgroundClass()).toBe("bg-clear");
	});

	it("should be case-insensitive for weather conditions", () =>
	{
		fixture.componentRef.setInput("weatherCondition", "rain");
		expect(component.backgroundClass()).toBe("bg-rain");

		fixture.componentRef.setInput("weatherCondition", "RAIN");
		expect(component.backgroundClass()).toBe("bg-rain");
	});
});
