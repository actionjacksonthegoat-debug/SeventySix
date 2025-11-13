import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HealthApiService } from "../../../../../core/services/admin/health-api.service";
import { of, throwError } from "rxjs";
import { HealthStatus } from "../../../../../core/models/admin/health-status.model";
import { provideZonelessChangeDetection } from "@angular/core";
import { HealthStatusPanelComponent } from "./health-status-panel.component";

describe("HealthStatusPanelComponent", () =>
{
	let component: HealthStatusPanelComponent;
	let fixture: ComponentFixture<HealthStatusPanelComponent>;
	let healthApiService: jasmine.SpyObj<HealthApiService>;

	const mockHealthData: HealthStatus = {
		status: "Healthy",
		checkedAt: "2024-11-12T12:00:00Z",
		database: {
			isConnected: true,
			responseTimeMs: 50,
			activeConnections: 25,
			status: "Healthy"
		},
		externalApis: {
			apis: {
				OpenWeather: {
					apiName: "OpenWeather",
					isAvailable: true,
					responseTimeMs: 120,
					lastChecked: "2024-11-12T11:55:00Z"
				},
				GeocodeAPI: {
					apiName: "GeocodeAPI",
					isAvailable: false,
					responseTimeMs: 850,
					lastChecked: "2024-11-12T11:50:00Z"
				}
			}
		},
		errorQueue: {
			queuedItems: 5,
			failedItems: 2,
			circuitBreakerOpen: false,
			status: "Healthy"
		},
		system: {
			cpuUsagePercent: 35.5,
			memoryUsedMb: 2048,
			memoryTotalMb: 8192,
			diskUsagePercent: 45.0
		}
	};

	beforeEach(async () =>
	{
		const healthApiServiceSpy = jasmine.createSpyObj("HealthApiService", [
			"getHealth"
		]);

		await TestBed.configureTestingModule({
			imports: [HealthStatusPanelComponent],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: HealthApiService, useValue: healthApiServiceSpy }
			]
		}).compileComponents();

		healthApiService = TestBed.inject(
			HealthApiService
		) as jasmine.SpyObj<HealthApiService>;
		fixture = TestBed.createComponent(HealthStatusPanelComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));
		expect(component).toBeTruthy();
	});

	it("should load health data on init", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));

		fixture.detectChanges();

		expect(healthApiService.getHealth).toHaveBeenCalled();
		expect(component.isLoading()).toBeFalse();
		expect(component.healthData()).toEqual(mockHealthData);
	});

	it("should show loading state when isLoading is true", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));

		// Trigger init which will complete immediately
		fixture.detectChanges();

		// Then manually set loading state
		component.isLoading.set(true);
		component.healthData.set(null);
		component.error.set(null);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("Loading health status...");
	});

	it("should handle error when loading health data fails", () =>
	{
		const errorMessage = "Failed to fetch health data";
		healthApiService.getHealth.and.returnValue(
			throwError(() => new Error(errorMessage))
		);

		fixture.detectChanges();

		expect(component.isLoading()).toBeFalse();
		expect(component.error()).toBe(errorMessage);
	});

	it("should display error message when health data fails to load", () =>
	{
		healthApiService.getHealth.and.returnValue(
			throwError(() => new Error("API error"))
		);

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector(".error-container")).toBeTruthy();
		expect(compiled.textContent).toContain("API error");
	});

	it("should refresh health data when onRefresh is called", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));

		fixture.detectChanges();
		component.onRefresh();

		expect(healthApiService.getHealth).toHaveBeenCalledTimes(2);
	});

	it("should display overall status chip with correct color", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const statusChip = compiled.querySelector(".overall-status mat-chip");
		expect(statusChip).toBeTruthy();
		expect(statusChip?.textContent).toContain("Healthy");
	});

	it("should display database health status", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("Database");
		expect(compiled.textContent).toContain("50ms");
		expect(compiled.textContent).toContain("25 active");
	});

	it("should display external API health statuses", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("OpenWeather");
		expect(compiled.textContent).toContain("120ms");
		expect(compiled.textContent).toContain("GeocodeAPI");
		expect(compiled.textContent).toContain("850ms");
	});

	it("should display queue health status", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("Queue");
		expect(compiled.textContent).toContain("5 queued");
		expect(compiled.textContent).toContain("2 failed");
	});

	it("should display system resource metrics", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("CPU");
		expect(compiled.textContent).toContain("35.5%");
		expect(compiled.textContent).toContain("Memory");
		expect(compiled.textContent).toContain("2048 MB");
		expect(compiled.textContent).toContain("Disk");
		expect(compiled.textContent).toContain("45%");
	});

	it("should apply correct status colors based on health status", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const healthyChips = compiled.querySelectorAll(
			"mat-chip.status-healthy"
		);
		const unhealthyChips = compiled.querySelectorAll(
			"mat-chip.status-unhealthy"
		);

		expect(healthyChips.length).toBeGreaterThan(0);
		expect(unhealthyChips.length).toBeGreaterThan(0);
	});

	it("should return empty array when healthData is null", () =>
	{
		component.healthData.set(null);
		expect(component.getApiNames()).toEqual([]);
	});

	it("should return API names from external APIs", () =>
	{
		healthApiService.getHealth.and.returnValue(of(mockHealthData));
		fixture.detectChanges();

		const apiNames = component.getApiNames();
		expect(apiNames).toContain("OpenWeather");
		expect(apiNames).toContain("GeocodeAPI");
		expect(apiNames.length).toBe(2);
	});

	it("should handle errors without message gracefully", () =>
	{
		healthApiService.getHealth.and.returnValue(throwError(() => ({})));

		fixture.detectChanges();

		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBe("Failed to load health data");
		expect(component.healthData()).toBeNull();
	});
});
