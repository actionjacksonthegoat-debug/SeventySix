import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { LogLevel, LogStatistics } from "@core/models/logs";
import { LogSummaryComponent } from "./log-summary.component";

describe("LogSummaryComponent", () =>
{
	let component: LogSummaryComponent;
	let fixture: ComponentFixture<LogSummaryComponent>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [LogSummaryComponent],
			providers: [provideZonelessChangeDetection()]
		}).compileComponents();

		fixture = TestBed.createComponent(LogSummaryComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should display total count", () =>
	{
		const stats: LogStatistics = {
			totalCount: 1234,
			errorCount: 100,
			warningCount: 200,
			fatalCount: 10,
			lastUpdated: new Date()
		};

		fixture.componentRef.setInput("statistics", stats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("1,234");
	});

	it("should display error count", () =>
	{
		const stats: LogStatistics = {
			totalCount: 1000,
			errorCount: 456,
			warningCount: 100,
			fatalCount: 5,
			lastUpdated: new Date()
		};

		fixture.componentRef.setInput("statistics", stats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("456");
	});

	it("should display warning count", () =>
	{
		const stats: LogStatistics = {
			totalCount: 1000,
			errorCount: 100,
			warningCount: 678,
			fatalCount: 5,
			lastUpdated: new Date()
		};

		fixture.componentRef.setInput("statistics", stats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("678");
	});

	it("should display fatal count", () =>
	{
		const stats: LogStatistics = {
			totalCount: 1000,
			errorCount: 100,
			warningCount: 200,
			fatalCount: 12,
			lastUpdated: new Date()
		};

		fixture.componentRef.setInput("statistics", stats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("12");
	});

	it("should display last updated time when provided", () =>
	{
		const lastUpdated = new Date();

		fixture.componentRef.setInput("lastUpdated", lastUpdated);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("updated");
	});

	it("should not display last updated when not provided", () =>
	{
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).not.toContain("updated");
	});

	it("should format large numbers with commas", () =>
	{
		const stats: LogStatistics = {
			totalCount: 123456,
			errorCount: 12345,
			warningCount: 67890,
			fatalCount: 123,
			lastUpdated: new Date()
		};

		fixture.componentRef.setInput("statistics", stats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("123,456");
		expect(compiled.textContent).toContain("12,345");
		expect(compiled.textContent).toContain("67,890");
	});

	it("should display zero counts", () =>
	{
		const stats: LogStatistics = {
			totalCount: 100,
			errorCount: 0,
			warningCount: 0,
			fatalCount: 0,
			lastUpdated: new Date()
		};

		fixture.componentRef.setInput("statistics", stats);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.textContent).toContain("100");
	});

	it("should handle null statistics gracefully", () =>
	{
		fixture.componentRef.setInput("statistics", null);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled).toBeTruthy();
	});

	it("should show relative time for last updated", () =>
	{
		const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

		fixture.componentRef.setInput("lastUpdated", twoMinutesAgo);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		// Should show something like "2 minutes ago"
		expect(compiled.textContent).toContain("ago");
	});

	it("should compute formatted total count", () =>
	{
		const stats: LogStatistics = {
			totalCount: 5432,
			errorCount: 100,
			warningCount: 200,
			fatalCount: 10,
			lastUpdated: new Date()
		};

		fixture.componentRef.setInput("statistics", stats);
		fixture.detectChanges();

		expect(component.formattedTotal()).toBe("5,432");
	});

	it("should return empty string when statistics is null", () =>
	{
		fixture.componentRef.setInput("statistics", null);
		fixture.detectChanges();

		expect(component.formattedTotal()).toBe("");
		expect(component.formattedErrors()).toBe("");
		expect(component.formattedWarnings()).toBe("");
		expect(component.formattedFatals()).toBe("");
	});
});
