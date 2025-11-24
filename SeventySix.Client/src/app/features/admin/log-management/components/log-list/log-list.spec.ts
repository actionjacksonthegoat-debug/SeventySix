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

	it("should define column configuration", () =>
	{
		expect(component.columns).toBeDefined();
		expect(component.columns.length).toBe(6);
		expect(component.columns[0].key).toBe("logLevel");
		expect(component.columns[1].key).toBe("timestamp");
	});

	it("should define quick filters", () =>
	{
		expect(component.quickFilters).toBeDefined();
		expect(component.quickFilters.length).toBe(2);
		expect(component.quickFilters[0].key).toBe("error");
		expect(component.quickFilters[1].key).toBe("warning");
	});

	it("should define row actions", () =>
	{
		expect(component.rowActions).toBeDefined();
		expect(component.rowActions.length).toBe(2);
		expect(component.rowActions[0].key).toBe("view");
		expect(component.rowActions[1].key).toBe("delete");
	});

	it("should define bulk actions", () =>
	{
		expect(component.bulkActions).toBeDefined();
		expect(component.bulkActions.length).toBe(1);
		expect(component.bulkActions[0].key).toBe("delete");
	});
});
