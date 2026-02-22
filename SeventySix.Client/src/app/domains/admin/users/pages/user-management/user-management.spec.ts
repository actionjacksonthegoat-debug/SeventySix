import { UserService } from "@admin/users/services";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { UserManagementPage } from "./user-management";

describe("UserManagementPage",
	() =>
	{
		let fixture: ComponentFixture<UserManagementPage>;

		const mockUserService: Partial<UserService> =
			{
				getPagedUsers: vi
					.fn()
					.mockReturnValue(
						{
							data: () => ({ items: [], totalCount: 0, page: 1, pageSize: 50 }),
							isLoading: () => false,
							error: () => null,
							isSuccess: () => true
						}),
				updateUser: vi
					.fn()
					.mockReturnValue(
						{
							mutate: vi.fn(),
							isPending: () => false
						}),
				resetPassword: vi
					.fn()
					.mockReturnValue(
						{
							mutate: vi.fn(),
							isPending: () => false
						}),
				restoreUser: vi
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
						})
			};

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [UserManagementPage],
							providers: [
								provideZonelessChangeDetection(),
								provideHttpClientTesting(),
								provideRouter([]),
								{ provide: UserService, useValue: mockUserService }
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(UserManagementPage);
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(fixture.componentInstance)
					.toBeTruthy();
			});

		it("should render page header with title",
			() =>
			{
				const header: HTMLElement | null =
					fixture.nativeElement.querySelector("app-page-header");
				expect(header)
					.toBeTruthy();
			});

		describe("CLS Prevention",
			() =>
			{
				it("should have page-content element for CLS prevention",
					() =>
					{
						const pageContent: HTMLElement | null =
							fixture.nativeElement.querySelector(".page-content");
						expect(pageContent)
							.toBeTruthy();
						expect(pageContent?.classList.contains("page-content"))
							.toBe(true);
					});
			});
	});