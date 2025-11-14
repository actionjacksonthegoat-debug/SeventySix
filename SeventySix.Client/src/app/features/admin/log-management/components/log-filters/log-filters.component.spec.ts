import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { LogLevel } from "@admin/log-management/models";
import { LogFiltersComponent } from "./log-filters.component";

describe("LogFiltersComponent", () =>
{
	let component: LogFiltersComponent;
	let fixture: ComponentFixture<LogFiltersComponent>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [LogFiltersComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(LogFiltersComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should initialize with default filter values", () =>
	{
		expect(component.searchTerm()).toBe("");
		expect(component.selectedLevel()).toBeNull();
		expect(component.dateRange()).toBe("24h");
		expect(component.autoRefresh()).toBe(false);
	});

	it("should update search term", () =>
	{
		component.searchTerm.set("error message");

		expect(component.searchTerm()).toBe("error message");
	});

	it("should emit filterChange when search term changes", (done: DoneFn) =>
	{
		component.filterChange.subscribe((filter) =>
		{
			expect(filter.searchTerm).toBe("test");
			done();
		});

		component.onSearchChange("test");
	});

	it("should update selected log level", () =>
	{
		component.onLevelChange(LogLevel.Error);

		expect(component.selectedLevel()).toBe(LogLevel.Error);
	});

	it("should emit filterChange when level changes", (done: DoneFn) =>
	{
		component.filterChange.subscribe((filter) =>
		{
			expect(filter.logLevel).toBe(LogLevel.Warning);
			done();
		});

		component.onLevelChange(LogLevel.Warning);
	});

	it("should clear level filter when clicking All", () =>
	{
		component.onLevelChange(LogLevel.Error);
		component.onLevelChange(null);

		expect(component.selectedLevel()).toBeNull();
	});

	it("should update date range", () =>
	{
		component.onDateRangeChange("7d");

		expect(component.dateRange()).toBe("7d");
	});

	it("should emit filterChange with calculated dates for 24h range", (done: DoneFn) =>
	{
		component.filterChange.subscribe((filter) =>
		{
			expect(filter.startDate).toBeDefined();
			expect(filter.endDate).toBeDefined();
			const diff =
				filter.endDate!.getTime() - filter.startDate!.getTime();
			expect(diff).toBeCloseTo(24 * 60 * 60 * 1000, -3);
			done();
		});

		component.onDateRangeChange("24h");
	});

	it("should emit filterChange with calculated dates for 7d range", (done: DoneFn) =>
	{
		component.filterChange.subscribe((filter) =>
		{
			const diff =
				filter.endDate!.getTime() - filter.startDate!.getTime();
			expect(diff).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3);
			done();
		});

		component.onDateRangeChange("7d");
	});

	it("should emit filterChange with calculated dates for 30d range", (done: DoneFn) =>
	{
		component.filterChange.subscribe((filter) =>
		{
			const diff =
				filter.endDate!.getTime() - filter.startDate!.getTime();
			expect(diff).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -3);
			done();
		});

		component.onDateRangeChange("30d");
	});

	it("should toggle auto-refresh", () =>
	{
		expect(component.autoRefresh()).toBe(false);

		component.onAutoRefreshToggle(true);

		expect(component.autoRefresh()).toBe(true);
	});

	it("should emit autoRefreshChange when toggled", (done: DoneFn) =>
	{
		component.autoRefreshChange.subscribe((enabled) =>
		{
			expect(enabled).toBe(true);
			done();
		});

		component.onAutoRefreshToggle(true);
	});

	it("should emit exportCsv event", (done: DoneFn) =>
	{
		component.exportCsv.subscribe(() =>
		{
			expect(true).toBe(true);
			done();
		});

		component.onExportClick();
	});

	it("should emit cleanupLogs event", (done: DoneFn) =>
	{
		component.cleanupLogs.subscribe(() =>
		{
			expect(true).toBe(true);
			done();
		});

		component.onCleanupClick();
	});

	it("should debounce search input", (done: DoneFn) =>
	{
		let emissionCount = 0;

		component.filterChange.subscribe(() =>
		{
			emissionCount++;
		});

		// Trigger multiple rapid changes
		component.onSearchChange("a");
		component.onSearchChange("ab");
		component.onSearchChange("abc");

		// Wait for debounce (300ms)
		setTimeout(() =>
		{
			// Should only emit once after debounce
			expect(emissionCount).toBe(1);
			done();
		}, 400);
	});

	it("should provide level options", () =>
	{
		const levels = component.levelOptions;

		expect(levels.length).toBe(6);
		expect(levels).toContain(LogLevel.Verbose);
		expect(levels).toContain(LogLevel.Debug);
		expect(levels).toContain(LogLevel.Information);
		expect(levels).toContain(LogLevel.Warning);
		expect(levels).toContain(LogLevel.Error);
		expect(levels).toContain(LogLevel.Fatal);
	});

	it("should provide date range options", () =>
	{
		const ranges = component.dateRangeOptions;

		expect(ranges.length).toBe(3);
		expect(ranges).toEqual(["24h", "7d", "30d"]);
	});

	it("should clear all filters", () =>
	{
		// Set some filters
		component.searchTerm.set("test");
		component.selectedLevel.set(LogLevel.Error);
		component.dateRange.set("7d");

		component.clearFilters();

		expect(component.searchTerm()).toBe("");
		expect(component.selectedLevel()).toBeNull();
		expect(component.dateRange()).toBe("24h");
	});

	it("should emit filterChange when clearing filters", (done: DoneFn) =>
	{
		component.searchTerm.set("test");
		component.selectedLevel.set(LogLevel.Error);

		component.filterChange.subscribe((filter) =>
		{
			expect(filter.searchTerm).toBe("");
			expect(filter.logLevel).toBeNull();
			done();
		});

		component.clearFilters();
	});
});
