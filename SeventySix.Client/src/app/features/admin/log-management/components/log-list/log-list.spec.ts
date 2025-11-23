import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import {
	QueryClient,
	provideAngularQuery
} from "@tanstack/angular-query-experimental";
import { LogList } from "./log-list";

describe("LogList", () =>
{
	let component: LogList;
	let fixture: ComponentFixture<LogList>;

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [LogList, NoopAnimationsModule],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideAngularQuery(new QueryClient())
			]
		}).compileComponents();

		fixture = TestBed.createComponent(LogList);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should initialize with default state", () =>
	{
		expect(component.filtersExpanded()).toBe(false);
		expect(component.searchFilter()).toBe("");
		expect(component.columns().length).toBeGreaterThan(0);
	});

	it("should emit logSelected when onLogSelected is called", (done) =>
	{
		const mockLog = {
			id: 1,
			timestamp: new Date(),
			logLevel: "Error",
			message: "Test error",
			sourceContext: "TestContext"
		} as any;

		component.logSelected.subscribe((log) =>
		{
			expect(log).toEqual(mockLog);
			done();
		});

		component.onLogSelected(mockLog);
	});

	it("should emit deleteLog when onDeleteLog is called", (done) =>
	{
		const logId = 123;

		component.deleteLog.subscribe((id) =>
		{
			expect(id).toBe(logId);
			done();
		});

		component.onDeleteLog(logId);
	});

	it("should emit deleteSelected when onDeleteSelected is called", (done) =>
	{
		const ids = [1, 2, 3];

		component.deleteSelected.subscribe((emittedIds) =>
		{
			expect(emittedIds).toEqual(ids);
			done();
		});

		component.onDeleteSelected(ids);
	});

	it("should toggle column visibility", () =>
	{
		const initialColumns = component.columns();
		const columnToToggle = initialColumns.find((c) => c.key === "level");
		const initialVisibility = columnToToggle?.visible;

		component.toggleColumn("level");

		const updatedColumns = component.columns();
		const updatedColumn = updatedColumns.find((c) => c.key === "level");

		expect(updatedColumn?.visible).toBe(!initialVisibility);
	});

	it("should clear search filter", () =>
	{
		component.searchFilter.set("test search");
		expect(component.searchFilter()).toBe("test search");

		component.clearSearch();

		expect(component.searchFilter()).toBe("");
	});

	it("should compute displayed columns correctly", () =>
	{
		const displayedColumns = component.displayedColumns();
		const visibleColumns = component
			.columns()
			.filter((c) => c.visible)
			.map((c) => c.key);

		expect(displayedColumns).toEqual(visibleColumns);
	});
});
