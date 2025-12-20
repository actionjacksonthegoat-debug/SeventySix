import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { StorageService } from "@shared/services";
import { UserListPreferences } from "@admin/users/models";
import { UserPreferencesService } from "./user-preferences.service";

describe("UserPreferencesService",
	() =>
	{
		let service: UserPreferencesService;
		let mockStorageService: jasmine.SpyObj<StorageService>;

		const defaultPreferences: UserListPreferences =
			{
				displayedColumns: [
					"select",
					"id",
					"username",
					"email",
					"fullName",
					"isActive",
					"createDate",
					"actions"
				],
				searchFilter: "",
				statusFilter: "all",
				chartExpanded: true
			};

		beforeEach(
			() =>
			{
				mockStorageService =
					jasmine.createSpyObj(
						"StorageService",
						[
							"getItem",
							"setItem",
							"removeItem"
						]);

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							UserPreferencesService,
							{ provide: StorageService, useValue: mockStorageService }
						]
					});

				service =
					TestBed.inject(UserPreferencesService);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("loadPreferences",
			() =>
			{
				it("should return stored preferences when available",
					() =>
					{
						// Arrange
						const storedPreferences: UserListPreferences =
							{
								displayedColumns: ["id", "username"],
								searchFilter: "test",
								statusFilter: "active",
								chartExpanded: false
							};
						mockStorageService
							.getItem
							.and
							.returnValue(storedPreferences);

						// Act
						const result: UserListPreferences =
							service.loadPreferences();

						// Assert
						expect(result)
							.toEqual(storedPreferences);
						expect(mockStorageService.getItem)
							.toHaveBeenCalledWith("user-list-preferences");
					});

				it("should return default preferences when storage is empty",
					() =>
					{
						// Arrange
						mockStorageService
							.getItem
							.and
							.returnValue(null);

						// Act
						const result: UserListPreferences =
							service.loadPreferences();

						// Assert
						expect(result)
							.toEqual(defaultPreferences);
					});
			});

		describe("savePreferences",
			() =>
			{
				it("should call storage service with preferences",
					() =>
					{
						// Arrange
						const preferences: UserListPreferences =
							{
								displayedColumns: ["id"],
								searchFilter: "search",
								statusFilter: "inactive",
								chartExpanded: true
							};

						// Act
						service.savePreferences(preferences);

						// Assert
						expect(mockStorageService.setItem)
							.toHaveBeenCalledWith(
								"user-list-preferences",
								preferences);
					});
			});

		describe("resetPreferences",
			() =>
			{
				it("should remove preferences from storage",
					() =>
					{
						// Act
						service.resetPreferences();

						// Assert
						expect(mockStorageService.removeItem)
							.toHaveBeenCalledWith("user-list-preferences");
					});
			});

		describe("updatePreference",
			() =>
			{
				it("should load, update, and save single preference",
					() =>
					{
						// Arrange
						mockStorageService
							.getItem
							.and
							.returnValue(
								{ ...defaultPreferences });

						// Act
						service.updatePreference(
							"chartExpanded",
							false);

						// Assert
						expect(mockStorageService.setItem)
							.toHaveBeenCalledWith(
								"user-list-preferences",
								jasmine.objectContaining(
									{ chartExpanded: false }));
					});
			});
	});
