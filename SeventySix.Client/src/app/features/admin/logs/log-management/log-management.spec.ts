import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { signal } from "@angular/core";
import { LogManagementPage } from "./log-management";
import { LogManagementService } from "@admin/logs/services";
import { MatDialog } from "@angular/material/dialog";

describe("LogManagementPage", () =>
{
	let fixture: ComponentFixture<LogManagementPage>;

	const mockLogService: Partial<LogManagementService> = {
		selectedIds: signal(new Set<number>()),
		selectedCount: signal(0),
		getLogs: jasmine.createSpy("getLogs").and.returnValue({
			data: () => ({ items: [], totalCount: 0, page: 1, pageSize: 50 }),
			isLoading: () => false,
			error: () => null,
			isSuccess: () => true
		}),
		deleteLog: jasmine.createSpy("deleteLog").and.returnValue({
			mutate: jasmine.createSpy("mutate"),
			isPending: () => false
		}),
		deleteLogs: jasmine.createSpy("deleteLogs").and.returnValue({
			mutate: jasmine.createSpy("mutate"),
			isPending: () => false
		}),
		updateFilter: jasmine.createSpy("updateFilter"),
		getCurrentFilter: jasmine
			.createSpy("getCurrentFilter")
			.and.returnValue({
				page: 1,
				pageSize: 50,
				sortBy: "Id",
				sortDescending: true
			}),
		clearSelection: jasmine.createSpy("clearSelection"),
		selectAll: jasmine.createSpy("selectAll"),
		toggleSelection: jasmine.createSpy("toggleSelection")
	};

	const mockDialog: Partial<MatDialog> = {
		open: jasmine.createSpy("open")
	};

	beforeEach(async () =>
	{
		await TestBed.configureTestingModule({
			imports: [LogManagementPage],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClientTesting(),
				{ provide: LogManagementService, useValue: mockLogService },
				{ provide: MatDialog, useValue: mockDialog }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(LogManagementPage);
	});

	it("should create", async () =>
	{
		await fixture.whenStable();
		expect(fixture.componentInstance).toBeTruthy();
	});

	it("should render page header", async () =>
	{
		await fixture.whenStable();
		fixture.detectChanges();

		const header: HTMLElement | null =
			fixture.nativeElement.querySelector("app-page-header");
		expect(header).toBeTruthy();
	});

	describe("CLS Prevention", () =>
	{
		it("should apply min-height to page-content to prevent layout shift", async () =>
		{
			await fixture.whenStable();
			fixture.detectChanges();

			const pageContent: HTMLElement | null =
				fixture.nativeElement.querySelector(".page-content");
			expect(pageContent).toBeTruthy();

			const styles: CSSStyleDeclaration = window.getComputedStyle(
				pageContent!
			);
			const minHeight: string = styles.minHeight;

			expect(minHeight).toBeTruthy();
			expect(minHeight).not.toBe("0px");
			expect(minHeight).not.toBe("auto");
		});
	});
});
