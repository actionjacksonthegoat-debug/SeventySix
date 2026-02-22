import {
	UserExportService,
	UserPreferencesService,
	UserService
} from "@admin/users/services";
import { DatePipe } from "@angular/common";
import { ComponentFixture } from "@angular/core/testing";
import { ComponentTestBed } from "@testing/test-bed-builders";
import { UserList } from "./user-list";

describe("UserList",
	() =>
	{
		let component: UserList;
		let fixture: ComponentFixture<UserList>;

		beforeEach(
			async () =>
			{
				fixture =
					await new ComponentTestBed<UserList>()
						.withAdminDefaults()
						.withRealService(UserService)
						.withRealService(UserExportService)
						.withRealService(UserPreferencesService)
						.withRealService(DatePipe)
						.build(UserList);

				component =
					fixture.componentInstance;
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should define column configuration",
			() =>
			{
				expect(component.columns)
					.toBeDefined();
				expect(component.columns.length)
					.toBe(7);
				expect(component.columns[0].key)
					.toBe("id");
			});

		it("should define quick filters",
			() =>
			{
				expect(component.quickFilters)
					.toBeDefined();
				expect(component.quickFilters.length)
					.toBe(4);
				expect(component.quickFilters[0].key)
					.toBe("all");
			});

		it("should define row actions",
			() =>
			{
				expect(component.rowActions)
					.toBeDefined();
				expect(component.rowActions.length)
					.toBe(5);
			});

		it("should include resetPassword in row actions",
			() =>
			{
				const resetPasswordAction: { key: string; label: string; icon: string; } | undefined =
					component
						.rowActions
						.find(
							(action) =>
								action.key === "resetPassword");
				expect(resetPasswordAction)
					.toBeTruthy();
				expect(resetPasswordAction?.label)
					.toBe("Reset Password");
				expect(resetPasswordAction?.icon)
					.toBe("lock_reset");
			});
	});