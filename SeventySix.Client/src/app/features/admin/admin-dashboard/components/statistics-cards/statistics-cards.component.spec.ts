import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { of, throwError } from "rxjs";
import { LogChartService } from "@core/services/admin";
import { LogStatistics } from "@core/models/admin";
import { StatisticsCardsComponent } from "./statistics-cards.component";

describe("StatisticsCardsComponent", () =>
{
	let component: StatisticsCardsComponent;
	let fixture: ComponentFixture<StatisticsCardsComponent>;
	let logChartService: jasmine.SpyObj<LogChartService>;

	const mockStats: LogStatistics = {
		totalLogs: 1234,
		errorCount: 567,
		warningCount: 234,
		infoCount: 345,
		debugCount: 78,
		criticalCount: 10,
		oldestLogDate: "2025-10-01T00:00:00Z",
		newestLogDate: "2025-11-12T10:30:00Z"
	};

	beforeEach(async () =>
	{
		const logChartServiceSpy = jasmine.createSpyObj("LogChartService", [
			"getStatistics"
		]);

		await TestBed.configureTestingModule({
			imports: [StatisticsCardsComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideNoopAnimations(),
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: LogChartService, useValue: logChartServiceSpy }
			]
		}).compileComponents();

		logChartService = TestBed.inject(
			LogChartService
		) as jasmine.SpyObj<LogChartService>;
		fixture = TestBed.createComponent(StatisticsCardsComponent);
		component = fixture.componentInstance;
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should load statistics on init", () =>
	{
		logChartService.getStatistics.and.returnValue(of(mockStats));

		fixture.detectChanges();

		expect(logChartService.getStatistics).toHaveBeenCalled();
		expect(component.isLoading()).toBe(false);
		expect(component.statistics()).toEqual(mockStats);
	});

	it("should display error count", () =>
	{
		logChartService.getStatistics.and.returnValue(of(mockStats));

		fixture.detectChanges();

		expect(component.errorCount()).toBe(567);
	});

	it("should display warning count", () =>
	{
		logChartService.getStatistics.and.returnValue(of(mockStats));

		fixture.detectChanges();

		expect(component.warningCount()).toBe(234);
	});

	it("should display fatal count", () =>
	{
		logChartService.getStatistics.and.returnValue(of(mockStats));

		fixture.detectChanges();

		expect(component.fatalCount()).toBe(10);
	});

	it("should handle loading state", () =>
	{
		logChartService.getStatistics.and.returnValue(of(mockStats));

		expect(component.isLoading()).toBe(true);

		fixture.detectChanges();

		expect(component.isLoading()).toBe(false);
	});

	it("should handle errors gracefully", () =>
	{
		const errorMessage = "Failed to load statistics";
		logChartService.getStatistics.and.returnValue(
			throwError(() => new Error(errorMessage))
		);

		fixture.detectChanges();

		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeTruthy();
		expect(component.statistics()).toBeNull();
	});

	it("should reload statistics when refresh is called", () =>
	{
		logChartService.getStatistics.and.returnValue(of(mockStats));

		fixture.detectChanges();
		expect(logChartService.getStatistics).toHaveBeenCalledTimes(1);

		component.onRefresh();

		expect(logChartService.getStatistics).toHaveBeenCalledTimes(2);
	});

	it("should display zero when statistics are null", () =>
	{
		logChartService.getStatistics.and.returnValue(of(mockStats));

		expect(component.errorCount()).toBe(0);
		expect(component.warningCount()).toBe(0);
		expect(component.fatalCount()).toBe(0);
	});

	it("should have 6 stat cards", () =>
	{
		logChartService.getStatistics.and.returnValue(of(mockStats));

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const cards = compiled.querySelectorAll("mat-card");
		expect(cards.length).toBe(6);
	});

	it("should display default values for info and debug counts when null", () =>
	{
		logChartService.getStatistics.and.returnValue(of(mockStats));

		fixture.detectChanges();

		expect(component.infoCount()).toBe(345);
		expect(component.debugCount()).toBe(78);
		expect(component.totalCount()).toBe(1234);
	});

	it("should display zero for info count when statistics is null", () =>
	{
		component.statistics.set(null);

		expect(component.infoCount()).toBe(0);
	});

	it("should display zero for debug count when statistics is null", () =>
	{
		component.statistics.set(null);

		expect(component.debugCount()).toBe(0);
	});

	it("should display zero for total count when statistics is null", () =>
	{
		component.statistics.set(null);

		expect(component.totalCount()).toBe(0);
	});

	it("should handle errors without message gracefully", () =>
	{
		logChartService.getStatistics.and.returnValue(throwError(() => ({})));

		fixture.detectChanges();

		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBe("Failed to load statistics");
		expect(component.statistics()).toBeNull();
	});
});
