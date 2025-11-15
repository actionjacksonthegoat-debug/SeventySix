import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { WeatherPreferencesService } from "./weather-preferences.service";
import { Units, TemperatureUnit, WindSpeedUnit } from "@home/weather/models";

describe("WeatherPreferencesService", () =>
{
	let service: WeatherPreferencesService;

	beforeEach(() =>
	{
		localStorage.clear(); // Clear BEFORE service instantiation

		// Mock matchMedia for reduced motion detection
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: jasmine.createSpy("matchMedia").and.returnValue({
				matches: false,
				media: "",
				onchange: null,
				addListener: jasmine.createSpy("addListener"),
				removeListener: jasmine.createSpy("removeListener"),
				addEventListener: jasmine.createSpy("addEventListener"),
				removeEventListener: jasmine.createSpy("removeEventListener"),
				dispatchEvent: jasmine.createSpy("dispatchEvent")
			})
		});

		TestBed.configureTestingModule({
			providers: [
				WeatherPreferencesService,
				provideZonelessChangeDetection()
			]
		});

		service = TestBed.inject(WeatherPreferencesService);
	});

	afterEach(() =>
	{
		localStorage.clear();
	});

	it("should be created with default preferences", () =>
	{
		expect(service).toBeTruthy();
		const prefs = service.getPreferences();
		expect(prefs().preferredUnits).toBe(Units.Metric);
		expect(prefs().temperatureUnit).toBe(TemperatureUnit.Celsius);
		expect(prefs().windSpeedUnit).toBe(WindSpeedUnit.MetersPerSecond);
		expect(prefs().animationsEnabled).toBe(true);
	});

	it("should update units preference", () =>
	{
		service.setUnits(Units.Imperial);
		expect(service.units()).toBe(Units.Imperial);
	});

	it("should update temperature unit", () =>
	{
		service.setTemperatureUnit(TemperatureUnit.Fahrenheit);
		expect(service.temperatureUnit()).toBe(TemperatureUnit.Fahrenheit);
	});

	it("should update wind speed unit", () =>
	{
		service.setWindSpeedUnit(WindSpeedUnit.MilesPerHour);
		expect(service.windSpeedUnit()).toBe(WindSpeedUnit.MilesPerHour);
	});

	it("should toggle animations", () =>
	{
		const initialValue = service.animationsEnabled();
		service.toggleAnimations();
		expect(service.animationsEnabled()).toBe(!initialValue);
	});

	it("should save preferences to localStorage", () =>
	{
		service.setUnits(Units.Imperial);
		service.setTemperatureUnit(TemperatureUnit.Fahrenheit);

		const saved = localStorage.getItem("weatherPreferences");
		expect(saved).toBeTruthy();

		const parsed = JSON.parse(saved!);
		expect(parsed.preferredUnits).toBe(Units.Imperial);
		expect(parsed.temperatureUnit).toBe(TemperatureUnit.Fahrenheit);
	});

	it("should load preferences from localStorage", () =>
	{
		const preferences = {
			geolocationGranted: false,
			geolocationDenied: false,
			preferredUnits: Units.Imperial,
			temperatureUnit: TemperatureUnit.Fahrenheit,
			windSpeedUnit: WindSpeedUnit.MilesPerHour,
			animationsEnabled: false,
			reducedMotion: false,
			lastUpdated: Date.now()
		};

		localStorage.setItem("weatherPreferences", JSON.stringify(preferences));

		// Create new service instance
		const newService = new WeatherPreferencesService();
		expect(newService.units()).toBe(Units.Imperial);
		expect(newService.temperatureUnit()).toBe(TemperatureUnit.Fahrenheit);
		expect(newService.windSpeedUnit()).toBe(WindSpeedUnit.MilesPerHour);
		expect(newService.animationsEnabled()).toBe(false);
	});

	it("should reset preferences to defaults", () =>
	{
		service.setUnits(Units.Imperial);
		service.setTemperatureUnit(TemperatureUnit.Fahrenheit);
		service.resetPreferences();

		expect(service.units()).toBe(Units.Metric);
		expect(service.temperatureUnit()).toBe(TemperatureUnit.Celsius);
		expect(localStorage.getItem("weatherPreferences")).toBeNull();
	});

	it("should update lastUpdated timestamp", (done) =>
	{
		const before = Date.now();
		service.setUnits(Units.Imperial);

		setTimeout(() =>
		{
			const prefs = service.getPreferences();
			expect(prefs().lastUpdated).toBeGreaterThanOrEqual(before);
			done();
		}, 10);
	});
});
