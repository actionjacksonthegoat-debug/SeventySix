import { LogManagementService } from "@admin/logs/services";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { LogManagementPage } from "./log-management";

describe("LogManagementPage",
	() =>
	{
		let fixture: ComponentFixture<LogManagementPage>;

		const mockLogService: Partial<LogManagementService> =
			{
				selectedIds: signal(new Set<number>()),
				selectedCount: signal(0),
				getLogs: vi
					.fn()
					.mockReturnValue(
						{
							data: () => ({ items: [], totalCount: 0, page: 1, pageSize: 50 }),
							isLoading: () => false,
							error: () => null,
							isSuccess: () => true
						}),
				deleteLog: vi
					.fn()
					.mockReturnValue(
						{
							mutate: vi.fn(),
							isPending: () => false
						}),
				deleteLogs: vi
					.fn()
					.mockReturnValue(
						{
							mutate: vi.fn(),
							isPending: () => false
						}),
				updateFilter: vi.fn(),
				getCurrentFilter: vi
					.fn()
					.mockReturnValue(
						{
							page: 1,
							pageSize: 50,
							sortBy: "Id",
							sortDescending: true
						}),
				clearSelection: vi.fn(),
				selectAll: vi.fn(),
				toggleSelection: vi.fn()
			};

		const mockDialog: Partial<MatDialog> =
			{
				open: vi.fn()
			};

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [LogManagementPage],
							providers: [
								provideZonelessChangeDetection(),
								provideHttpClientTesting(),
								{ provide: LogManagementService, useValue: mockLogService },
								{ provide: MatDialog, useValue: mockDialog }
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(LogManagementPage);
			});

		it("should create",
			async () =>
			{
				await fixture.whenStable();
				expect(fixture.componentInstance)
					.toBeTruthy();
			});

		it("should render page header",
			async () =>
			{
				await fixture.whenStable();
				fixture.detectChanges();

				const header: HTMLElement | null =
					fixture.nativeElement.querySelector("app-page-header");
				expect(header)
					.toBeTruthy();
			});

		describe("CLS Prevention",
			() =>
			{
				it("should have page-content element for CLS prevention",
					async () =>
					{
						// Note: The actual min-height is set via SCSS (vars.$cls-table-min-height)
						// which is not computed in headless DOM environments.
						// This test verifies the structure exists for CLS prevention.
						await fixture.whenStable();
						fixture.detectChanges();

						const pageContent: HTMLElement | null =
							fixture.nativeElement.querySelector(".page-content");
						expect(pageContent)
							.toBeTruthy();
						expect(pageContent?.classList.contains("page-content"))
							.toBe(true);
					});
			});
	});