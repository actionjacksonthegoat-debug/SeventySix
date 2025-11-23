import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { Router } from "@angular/router";
import { UserList } from "./user-list";
import { UserService } from "@features/admin/users/services/user.service";
import { LoggerService } from "@core/services/logger.service";
import {
	createMockQueryResult,
	createMockMutationResult
} from "@testing/tanstack-query-helpers";
import { User } from "@admin/users/models";

describe("UserList", () =>
{
	let component: UserList | undefined;
	let fixture: ComponentFixture<UserList> | undefined;
	let mockUserService: jasmine.SpyObj<UserService>;
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockRouter: jasmine.SpyObj<Router>;

	const mockUsers: User[] = [
		{
			id: 1,
			username: "john_doe",
			email: "john@example.com",
			fullName: "John Doe",
			createdAt: "2024-01-01T00:00:00Z",
			isActive: true,
			createdBy: "admin",
			modifiedAt: "2024-01-02T00:00:00Z",
			modifiedBy: "admin",
			lastLoginAt: "2024-01-03T00:00:00Z",
			rowVersion: 1
		},
		{
			id: 2,
			username: "jane_smith",
			email: "jane@example.com",
			fullName: "Jane Smith",
			createdAt: "2024-01-02T00:00:00Z",
			isActive: false,
			createdBy: "system",
			modifiedAt: "2024-01-03T00:00:00Z",
			modifiedBy: "system",
			lastLoginAt: "2024-01-04T00:00:00Z",
			rowVersion: 2
		}
	];

	beforeEach(async () =>
	{
		mockUserService = jasmine.createSpyObj("UserService", [
			"getAllUsers",
			"bulkActivateUsers",
			"bulkDeactivateUsers"
		]);
		mockLogger = jasmine.createSpyObj("LoggerService", ["info", "error"]);
		mockRouter = jasmine.createSpyObj("Router", ["navigate"]);

		await TestBed.configureTestingModule({
			imports: [UserList],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: UserService, useValue: mockUserService },
				{ provide: LoggerService, useValue: mockLogger },
				{ provide: Router, useValue: mockRouter }
			]
		}).compileComponents();
	});

	it("should create", () =>
	{
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>([])
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		expect(component).toBeTruthy();
	});

	it("should load users on initialization", async () =>
	{
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>(mockUsers)
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.users()).toEqual(mockUsers);
		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBeNull();
		expect(mockLogger.info).toHaveBeenCalledWith(
			"Users loaded successfully",
			{ count: 2 }
		);
	});

	it("should handle error when loading users fails", async () =>
	{
		const error: Error = new Error("Network error");
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>(undefined, {
				isError: true,
				error
			})
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.users()).toEqual([]);
		expect(component.isLoading()).toBe(false);
		expect(component.error()).toBe(
			"Failed to load users. Please try again."
		);
		expect(mockLogger.error).toHaveBeenCalledWith(
			"Failed to load users",
			error
		);
	});

	it("should compute user statistics correctly", async () =>
	{
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>(mockUsers)
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		expect(component.userCount()).toBe(2);
		expect(component.activeUserCount()).toBe(1);
		expect(component.inactiveUserCount()).toBe(1);
		expect(component.hasUsers()).toBe(true);
	});

	it("should retry loading users", async () =>
	{
		const error: Error = new Error("Error");
		const errorQuery = createMockQueryResult<User[], Error>(undefined, {
			isError: true,
			error
		});
		mockUserService.getAllUsers.and.returnValue(errorQuery);

		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		// Verify error state
		expect(component.error()).toBe(
			"Failed to load users. Please try again."
		);

		// Update the refetch spy to simulate successful retry
		const refetchSpy = errorQuery.refetch as jasmine.Spy;
		refetchSpy.and.returnValue(
			Promise.resolve({
				data: mockUsers,
				error: null,
				isError: false,
				isSuccess: true
			})
		);

		// Manually update the query signals to simulate successful refetch
		(component.usersQuery.data as any).set(mockUsers);
		(component.usersQuery.isError as any).set(false);
		(component.usersQuery.error as any).set(null);
		(component.usersQuery.isLoading as any).set(false);

		component.retry();
		await fixture.whenStable();

		expect(component.usersQuery.refetch).toHaveBeenCalled();
		expect(component.error()).toBeNull();
	});

	it("should display users in table after loading", () =>
	{
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>(mockUsers)
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;
		fixture.detectChanges();

		const compiled = fixture.nativeElement;
		const rows = compiled.querySelectorAll("tbody tr");

		expect(rows.length).toBeGreaterThan(0);
	});

	it("should display status chips for users", () =>
	{
		mockUserService.getAllUsers.and.returnValue(
			createMockQueryResult<User[], Error>(mockUsers)
		);
		fixture = TestBed.createComponent(UserList);
		component = fixture.componentInstance;
		fixture.detectChanges();

		const compiled = fixture.nativeElement;
		const chips = compiled.querySelectorAll("mat-chip");

		expect(chips.length).toBeGreaterThan(0);
	});

	describe("Status Filtering", () =>
	{
		beforeEach(() =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>(mockUsers)
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();
		});

		it("should filter active users when status filter is set to active", () =>
		{
			component!.setStatusFilter("active");

			expect(component!.filteredUsers()).toEqual([mockUsers[0]]);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Status filter changed",
				{ status: "active" }
			);
		});

		it("should filter inactive users when status filter is set to inactive", () =>
		{
			component!.setStatusFilter("inactive");

			expect(component!.filteredUsers()).toEqual([mockUsers[1]]);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Status filter changed",
				{ status: "inactive" }
			);
		});

		it("should show all users when status filter is set to all", () =>
		{
			component!.setStatusFilter("all");

			expect(component!.filteredUsers()).toEqual(mockUsers);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Status filter changed",
				{ status: "all" }
			);
		});
	});

	describe("Search Filtering", () =>
	{
		beforeEach(() =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>(mockUsers)
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();
		});

		it("should apply search filter to table", () =>
		{
			component!.searchFilter.set("john");
			component!.applyFilter();

			expect(component!.dataSource.filter).toBe("john");
		});

		it("should reset paginator to first page when filter applied", () =>
		{
			component!.ngAfterViewInit();
			fixture!.detectChanges();

			const paginatorSpy = spyOn(
				component!.dataSource.paginator!,
				"firstPage"
			);

			component!.searchFilter.set("test");
			component!.applyFilter();

			expect(paginatorSpy).toHaveBeenCalled();
		});

		it("should clear filter", () =>
		{
			component!.searchFilter.set("john");
			component!.applyFilter();

			component!.clearFilter();

			expect(component!.searchFilter()).toBe("");
			expect(component!.dataSource.filter).toBe("");
		});

		it("should filter by username", () =>
		{
			component!.ngAfterViewInit();

			const filterPredicate = component!.dataSource.filterPredicate!;
			expect(filterPredicate(mockUsers[0], "john")).toBe(true);
			expect(filterPredicate(mockUsers[1], "john")).toBe(false);
		});

		it("should filter by email", () =>
		{
			component!.ngAfterViewInit();

			const filterPredicate = component!.dataSource.filterPredicate!;
			expect(filterPredicate(mockUsers[0], "john@example")).toBe(true);
			expect(filterPredicate(mockUsers[1], "john@example")).toBe(false);
		});

		it("should filter by fullName", () =>
		{
			component!.ngAfterViewInit();

			const filterPredicate = component!.dataSource.filterPredicate!;
			expect(filterPredicate(mockUsers[0], "john doe")).toBe(true);
			expect(filterPredicate(mockUsers[1], "john doe")).toBe(false);
		});

		it("should filter by id", () =>
		{
			component!.ngAfterViewInit();

			const filterPredicate = component!.dataSource.filterPredicate!;
			expect(filterPredicate(mockUsers[0], "1")).toBe(true);
			expect(filterPredicate(mockUsers[1], "1")).toBe(false);
		});
	});

	describe("Column Visibility", () =>
	{
		beforeEach(() =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>([])
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();
		});

		it("should toggle column visibility", () =>
		{
			const initialVisible = component!.columnDefs()[1].visible; // id column

			component!.toggleColumn("id");

			expect(component!.columnDefs()[1].visible).toBe(!initialVisible);
		});

		it("should save column preferences after toggle", () =>
		{
			const saveSpy = spyOn<any>(component!, "saveColumnPreferences");

			component!.toggleColumn("email");

			expect(saveSpy).toHaveBeenCalled();
		});

		it("should save column preferences to localStorage", () =>
		{
			const setItemSpy = spyOn(localStorage, "setItem");

			component!.saveColumnPreferences();

			expect(setItemSpy).toHaveBeenCalledWith(
				"userListColumns",
				jasmine.any(String)
			);
		});

		it("should load column preferences from localStorage", () =>
		{
			const prefs = JSON.stringify({ id: false, username: true });
			spyOn(localStorage, "getItem").and.returnValue(prefs);

			component!.loadColumnPreferences();

			const idColumn = component!
				.columnDefs()
				.find((col) => col.key === "id");
			expect(idColumn?.visible).toBe(false);
		});

		it("should use default visibility when no localStorage data exists", () =>
		{
			spyOn(localStorage, "getItem").and.returnValue(null);
			const initialColumns = [...component!.columnDefs()];
			component!.loadColumnPreferences();

			expect(component!.columnDefs()).toEqual(initialColumns);
		});
	});

	describe("Bulk Selection", () =>
	{
		beforeEach(() =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>(mockUsers)
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();
		});

		it("should report all selected when all rows are selected", () =>
		{
			component!.dataSource.data = mockUsers;
			mockUsers.forEach((user) => component!.selection.select(user));

			expect(component!.isAllSelected()).toBe(true);
		});

		it("should report not all selected when some rows are selected", () =>
		{
			component!.dataSource.data = mockUsers;
			component!.selection.select(mockUsers[0]);

			expect(component!.isAllSelected()).toBe(false);
		});

		it("should report not all selected when no data exists", () =>
		{
			component!.dataSource.data = [];

			expect(component!.isAllSelected()).toBe(false);
		});

		it("should toggle all rows from none selected to all selected", () =>
		{
			component!.dataSource.data = mockUsers;

			component!.toggleAllRows();

			expect(component!.selection.selected.length).toBe(mockUsers.length);
		});

		it("should toggle all rows from all selected to none selected", () =>
		{
			component!.dataSource.data = mockUsers;
			mockUsers.forEach((user) => component!.selection.select(user));

			component!.toggleAllRows();

			expect(component!.selection.selected.length).toBe(0);
		});

		it("should compute selected count", () =>
		{
			component!.dataSource.data = mockUsers;
			component!.selection.select(mockUsers[0]);

			// Verify selection was made (SelectionModel is not reactive)
			expect(component!.selection.selected.length).toBe(1);
			expect(component!.selection.isSelected(mockUsers[0])).toBe(true);
		});
	});

	describe("Navigation", () =>
	{
		beforeEach(() =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>(mockUsers)
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();
		});

		it("should navigate to create user page", () =>
		{
			component!.addUser();

			expect(mockRouter.navigate).toHaveBeenCalledWith([
				"/admin/users/create"
			]);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Navigating to create user"
			);
		});

		it("should navigate to edit user page", () =>
		{
			component!.editUser(mockUsers[0]);

			expect(mockRouter.navigate).toHaveBeenCalledWith([
				"/admin/users",
				1
			]);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Navigating to user detail",
				{ userId: 1 }
			);
		});

		it("should navigate to user logs with query params", () =>
		{
			component!.viewUserLogs(mockUsers[0]);

			expect(mockRouter.navigate).toHaveBeenCalledWith(["/admin/logs"], {
				queryParams: {
					userId: 1,
					userName: "john_doe"
				}
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Navigating to logs for user",
				{
					userId: 1,
					username: "john_doe"
				}
			);
		});
	});

	describe("Status Color", () =>
	{
		beforeEach(() =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>([])
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();
		});

		it("should return primary color for active users", () =>
		{
			expect(component!.getStatusColor(mockUsers[0])).toBe("primary");
		});

		it("should return warn color for inactive users", () =>
		{
			expect(component!.getStatusColor(mockUsers[1])).toBe("warn");
		});
	});

	describe("Bulk Actions", () =>
	{
		let mockDialog: jasmine.SpyObj<any>;
		let dialogOpenSpy: jasmine.Spy;

		beforeEach(() =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>(mockUsers)
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;

			mockDialog = jasmine.createSpyObj("MatDialogRef", ["afterClosed"]);
			mockDialog.afterClosed.and.returnValue({
				subscribe: (callback: (result: boolean) => void) =>
					callback(true)
			});

			dialogOpenSpy = spyOn(component!["dialog"], "open").and.returnValue(
				mockDialog
			);

			fixture.detectChanges();
		});

		it("should not delete when no users selected", () =>
		{
			component!.deleteSelected();

			expect(component!["dialog"].open).not.toHaveBeenCalled();
		});

		it("should open confirmation dialog when deleting users", () =>
		{
			component!.selection.select(mockUsers[0]);

			component!.deleteSelected();

			expect(component!["dialog"].open).toHaveBeenCalled();
		});

		it("should show singular message for single user deletion", () =>
		{
			component!.selection.select(mockUsers[0]);

			component!.deleteSelected();

			const dialogData = dialogOpenSpy.calls.argsFor(0)[1].data;
			expect(dialogData.message).toContain("1 user");
		});

		it("should show plural message for multiple user deletion", () =>
		{
			component!.selection.select(mockUsers[0]);
			component!.selection.select(mockUsers[1]);

			component!.deleteSelected();

			const dialogData = dialogOpenSpy.calls.argsFor(0)[1].data;
			expect(dialogData.message).toContain("2 users");
		});

		it("should log deletion when confirmed", () =>
		{
			component!.selection.select(mockUsers[0]);

			component!.deleteSelected();

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Bulk delete confirmed",
				{ count: 1 }
			);
		});

		it("should clear selection after deletion", () =>
		{
			component!.selection.select(mockUsers[0]);

			component!.deleteSelected();

			expect(component!.selection.selected.length).toBe(0);
		});

		it("should log cancellation when delete is cancelled", () =>
		{
			mockDialog.afterClosed.and.returnValue({
				subscribe: (callback: (result: boolean) => void) =>
					callback(false)
			});

			component!.selection.select(mockUsers[0]);
			component!.deleteSelected();

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Bulk delete cancelled"
			);
		});

		it("should not export when no users selected", () =>
		{
			const initialCallCount = mockLogger.info.calls.count();

			component!.exportSelected();

			expect(mockLogger.info.calls.count()).toBe(initialCallCount);
		});
		it("should log export when users selected", () =>
		{
			component!.selection.select(mockUsers[0]);
			component!.selection.select(mockUsers[1]);

			component!.exportSelected();

			expect(mockLogger.info).toHaveBeenCalledWith("Export requested", {
				count: 2
			});
		});
	});

	describe("Chart Events", () =>
	{
		beforeEach(() =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>(mockUsers)
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();
		});

		it("should refresh data when chart refresh is triggered", () =>
		{
			component!.onChartRefresh();

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Chart refresh requested"
			);
			expect(component!.usersQuery.refetch).toHaveBeenCalled();
		});
		it("should log chart PNG export request", () =>
		{
			spyOn(window, "alert");

			component!.onChartExportPng();

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Chart PNG export requested"
			);
		});

		it("should log chart CSV export request", () =>
		{
			spyOn(window, "alert");

			component!.onChartExportCsv();

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Chart CSV export requested"
			);
		});
	});

	describe("User Stats Chart", () =>
	{
		it("should generate chart data from users grouped by month", () =>
		{
			const testUsers: User[] = [
				{
					id: 1,
					username: "user1",
					email: "user1@test.com",
					fullName: "User One",
					createdAt: "2024-01-15T00:00:00Z",
					isActive: true
				},
				{
					id: 2,
					username: "user2",
					email: "user2@test.com",
					fullName: "User Two",
					createdAt: "2024-01-20T00:00:00Z",
					isActive: false
				},
				{
					id: 3,
					username: "user3",
					email: "user3@test.com",
					fullName: "User Three",
					createdAt: "2024-02-10T00:00:00Z",
					isActive: true
				}
			];

			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>(testUsers)
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();

			const chartData = component!.userStatsChartData();

			expect(chartData.datasets).toBeDefined();
			expect(chartData.datasets!.length).toBe(2);
			expect(chartData.datasets![0].label).toBe("Active Users");
			expect(chartData.datasets![1].label).toBe("Inactive Users");
		});

		it("should limit chart data to last 6 months", () =>
		{
			const testUsers: User[] = [];
			for (let i = 0; i < 12; i++)
			{
				testUsers.push({
					id: i + 1,
					username: `user${i + 1}`,
					email: `user${i + 1}@test.com`,
					fullName: `User ${i + 1}`,
					createdAt: new Date(2024, i, 1).toISOString(),
					isActive: true
				});
			}

			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>(testUsers)
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();

			const chartData = component!.userStatsChartData();

			expect(chartData.labels!.length).toBe(6);
		});
	});

	describe("Audit Column Definitions", () =>
	{
		it("should include audit columns in column definitions", () =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>([])
			);
			mockUserService.bulkActivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			mockUserService.bulkDeactivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();

			const columnDefs = component!.columnDefs();
			const columnKeys: string[] = columnDefs.map((col) => col.key);

			expect(columnKeys).toContain("createdBy");
			expect(columnKeys).toContain("modifiedAt");
			expect(columnKeys).toContain("modifiedBy");
			expect(columnKeys).toContain("lastLoginAt");
		});

		it("should have audit columns hidden by default", () =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>([])
			);
			mockUserService.bulkActivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			mockUserService.bulkDeactivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();

			const columnDefs = component!.columnDefs();
			const createdByCol = columnDefs.find((c) => c.key === "createdBy");
			const modifiedAtCol = columnDefs.find(
				(c) => c.key === "modifiedAt"
			);
			const modifiedByCol = columnDefs.find(
				(c) => c.key === "modifiedBy"
			);
			const lastLoginCol = columnDefs.find(
				(c) => c.key === "lastLoginAt"
			);

			expect(createdByCol?.visible).toBe(false);
			expect(modifiedAtCol?.visible).toBe(false);
			expect(modifiedByCol?.visible).toBe(false);
			expect(lastLoginCol?.visible).toBe(false);
		});
	});

	describe("Bulk Operations", () =>
	{
		it("should have bulkActivateMutation property", () =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>([])
			);
			mockUserService.bulkActivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			mockUserService.bulkDeactivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();

			expect(component!.bulkActivateMutation).toBeDefined();
		});

		it("should have bulkDeactivateMutation property", () =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>([])
			);
			mockUserService.bulkActivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			mockUserService.bulkDeactivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();

			expect(component!.bulkDeactivateMutation).toBeDefined();
		});

		it("should have activateSelected method", () =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>([])
			);
			mockUserService.bulkActivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			mockUserService.bulkDeactivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();

			expect(component!.activateSelected).toBeDefined();
			expect(typeof component!.activateSelected).toBe("function");
		});

		it("should have deactivateSelected method", () =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>([])
			);
			mockUserService.bulkActivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			mockUserService.bulkDeactivateUsers.and.returnValue(
				createMockMutationResult<number, Error, number[], unknown>()
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();

			expect(component!.deactivateSelected).toBeDefined();
			expect(typeof component!.deactivateSelected).toBe("function");
		});
	});

	describe("Virtual Scrolling", () =>
	{
		it("should import ScrollingModule", () =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>([])
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();

			const compiled = fixture.nativeElement;
			const viewport = compiled.querySelector(
				"cdk-virtual-scroll-viewport"
			);

			expect(viewport).toBeTruthy();
		});

		it("should set item size for virtual scroll", () =>
		{
			mockUserService.getAllUsers.and.returnValue(
				createMockQueryResult<User[], Error>([])
			);
			fixture = TestBed.createComponent(UserList);
			component = fixture.componentInstance;
			fixture.detectChanges();

			const compiled: HTMLElement = fixture.nativeElement;
			const viewport: HTMLElement | null = compiled.querySelector(
				"cdk-virtual-scroll-viewport"
			);

			expect(component.virtualScrollItemSize).toBe(48);
		});
	});
});
