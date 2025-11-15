import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { GeolocationError, GeolocationService } from "./geolocation.service";

/**
 * Create a mock GeolocationPosition for testing
 */
function createMockPosition(
	latitude: number,
	longitude: number,
	accuracy: number = 50
): GeolocationPosition
{
	return {
		coords: {
			latitude,
			longitude,
			accuracy,
			altitude: null,
			altitudeAccuracy: null,
			heading: null,
			speed: null,
			toJSON: () => ({})
		},
		timestamp: Date.now(),
		toJSON: () => ({})
	};
}

describe("GeolocationService", () =>
{
	let service: GeolocationService;
	let mockGeolocation: jasmine.SpyObj<Geolocation>;

	beforeEach(() =>
	{
		// Create mock geolocation
		mockGeolocation = jasmine.createSpyObj<Geolocation>("Geolocation", [
			"getCurrentPosition",
			"watchPosition",
			"clearWatch"
		]);

		// Replace navigator.geolocation
		Object.defineProperty(window.navigator, "geolocation", {
			value: mockGeolocation,
			configurable: true
		});

		TestBed.configureTestingModule({
			providers: [GeolocationService, provideZonelessChangeDetection()]
		});

		service = TestBed.inject(GeolocationService);

		// Clear localStorage before each test
		localStorage.clear();
	});

	afterEach(() =>
	{
		localStorage.clear();
	});

	describe("requestLocation", () =>
	{
		it("should request current position when geolocation is available", (done) =>
		{
			const mockPosition = createMockPosition(40.7128, -74.006, 50);

			mockGeolocation.getCurrentPosition.and.callFake((success) =>
			{
				success(mockPosition);
			});

			service.requestLocation().subscribe({
				next: (position: GeolocationPosition) =>
				{
					expect(position.coords.latitude).toBe(40.7128);
					expect(position.coords.longitude).toBe(-74.006);
					expect(
						mockGeolocation.getCurrentPosition
					).toHaveBeenCalled();
					done();
				},
				error: done.fail
			});
		});

		it("should handle permission denied error", (done) =>
		{
			const mockError: GeolocationPositionError = {
				code: 1, // PERMISSION_DENIED
				message: "User denied geolocation",
				PERMISSION_DENIED: 1,
				POSITION_UNAVAILABLE: 2,
				TIMEOUT: 3
			};

			mockGeolocation.getCurrentPosition.and.callFake(
				(success, error) =>
				{
					error!(mockError);
				}
			);

			service.requestLocation().subscribe({
				next: () =>
					done.fail(
						"Should have failed with permission denied error"
					),
				error: (error: GeolocationError) =>
				{
					expect(error.code).toBe(1);
					expect(error.message).toContain("denied");
					done();
				}
			});
		});

		it("should handle position unavailable error", (done) =>
		{
			const mockError: GeolocationPositionError = {
				code: 2, // POSITION_UNAVAILABLE
				message: "Position unavailable",
				PERMISSION_DENIED: 1,
				POSITION_UNAVAILABLE: 2,
				TIMEOUT: 3
			};

			mockGeolocation.getCurrentPosition.and.callFake(
				(success, error) =>
				{
					error!(mockError);
				}
			);

			service.requestLocation().subscribe({
				next: () =>
					done.fail(
						"Should have failed with position unavailable error"
					),
				error: (error: GeolocationError) =>
				{
					expect(error.code).toBe(2);
					done();
				}
			});
		});

		it("should handle timeout error", (done) =>
		{
			const mockError: GeolocationPositionError = {
				code: 3, // TIMEOUT
				message: "Request timeout",
				PERMISSION_DENIED: 1,
				POSITION_UNAVAILABLE: 2,
				TIMEOUT: 3
			};

			mockGeolocation.getCurrentPosition.and.callFake(
				(success, error) =>
				{
					error!(mockError);
				}
			);

			service.requestLocation().subscribe({
				next: () => done.fail("Should have failed with timeout error"),
				error: (error: GeolocationError) =>
				{
					expect(error.code).toBe(3);
					done();
				}
			});
		});

		it("should use default options when none provided", (done) =>
		{
			const mockPosition = createMockPosition(40.7128, -74.006, 50);

			mockGeolocation.getCurrentPosition.and.callFake(
				(success, error, options) =>
				{
					expect(options?.enableHighAccuracy).toBe(false);
					expect(options?.timeout).toBe(10000);
					expect(options?.maximumAge).toBe(300000);
					success(mockPosition);
				}
			);

			service.requestLocation().subscribe({
				next: () => done(),
				error: done.fail
			});
		});
	});

	describe("getCurrentLocation", () =>
	{
		it("should return current location signal", () =>
		{
			const location = service.getCurrentLocation();
			expect(location()).toBeUndefined();
		});

		it("should update location signal when position is received", (done) =>
		{
			const mockPosition = createMockPosition(40.7128, -74.006, 50);

			mockGeolocation.getCurrentPosition.and.callFake((success) =>
			{
				success(mockPosition);
			});

			service.requestLocation().subscribe({
				next: () =>
				{
					const location = service.getCurrentLocation();
					expect(location()).toBeDefined();
					expect(location()?.latitude).toBe(40.7128);
					expect(location()?.longitude).toBe(-74.006);
					done();
				},
				error: done.fail
			});
		});
	});

	describe("hasPermission", () =>
	{
		it("should return permission signal", () =>
		{
			const permission = service.hasPermission();
			expect(permission()).toBe(false);
		});

		it("should update permission signal after successful request", (done) =>
		{
			const mockPosition = createMockPosition(40.7128, -74.006, 50);

			mockGeolocation.getCurrentPosition.and.callFake((success) =>
			{
				success(mockPosition);
			});

			service.requestLocation().subscribe({
				next: () =>
				{
					const permission = service.hasPermission();
					expect(permission()).toBe(true);
					done();
				},
				error: done.fail
			});
		});

		it("should keep permission as false after denial", (done) =>
		{
			const mockError: GeolocationPositionError = {
				code: 1,
				message: "Permission denied",
				PERMISSION_DENIED: 1,
				POSITION_UNAVAILABLE: 2,
				TIMEOUT: 3
			};

			mockGeolocation.getCurrentPosition.and.callFake(
				(success, error) =>
				{
					error!(mockError);
				}
			);

			service.requestLocation().subscribe({
				next: () => done.fail("Should have failed"),
				error: () =>
				{
					const permission = service.hasPermission();
					expect(permission()).toBe(false);
					done();
				}
			});
		});
	});

	describe("localStorage integration", () =>
	{
		it("should save location to localStorage after successful request", (done) =>
		{
			const mockPosition = createMockPosition(40.7128, -74.006, 50);

			mockGeolocation.getCurrentPosition.and.callFake((success) =>
			{
				success(mockPosition);
			});

			service.requestLocation().subscribe({
				next: () =>
				{
					const saved = localStorage.getItem("weather_user_location");
					expect(saved).toBeTruthy();
					const location = JSON.parse(saved!);
					expect(location.latitude).toBe(40.7128);
					expect(location.longitude).toBe(-74.006);
					done();
				},
				error: done.fail
			});
		});

		it("should load location from localStorage on service init", () =>
		{
			const savedLocation = {
				latitude: 40.7128,
				longitude: -74.006,
				accuracy: 50
			};
			localStorage.setItem(
				"weather_user_location",
				JSON.stringify(savedLocation)
			);

			// Create new service instance
			const newService = new GeolocationService();
			const location = newService.getCurrentLocation();

			expect(location()).toBeDefined();
			expect(location()?.latitude).toBe(40.7128);
		});
	});
});
