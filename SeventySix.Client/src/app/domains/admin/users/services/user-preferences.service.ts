/**
 * User Preferences Service
 * Manages user-specific UI preferences for the user list
 * Follows SRP - Single Responsibility: User preference persistence
 */

import { UserListPreferences } from "@admin/users/models";
import { inject, Injectable } from "@angular/core";
import { StorageService } from "@shared/services";

const DEFAULT_PREFERENCES: UserListPreferences =
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

const STORAGE_KEY: string = "user-list-preferences";

/**
 * Provided at route level for proper garbage collection (see admin.routes.ts)
 */
@Injectable()
export class UserPreferencesService
{
	/**
	 * Storage service used to persist user preferences locally.
	 * @type {StorageService}
	 * @private
	 * @readonly
	 */
	private readonly storageService: StorageService =
		inject(StorageService);

	/**
	 * Load user preferences from storage
	 * @returns {UserListPreferences}
	 * UserListPreferences or defaults if none found
	 */
	loadPreferences(): UserListPreferences
	{
		const stored: UserListPreferences | null =
			this.storageService.getItem<UserListPreferences>(STORAGE_KEY);
		return stored || DEFAULT_PREFERENCES;
	}

	/**
	 * Save user preferences to storage
	 * @param {UserListPreferences} preferences
	 * Preferences to save
	 * @returns {void}
	 */
	savePreferences(preferences: UserListPreferences): void
	{
		this.storageService.setItem(STORAGE_KEY, preferences);
	}

	/**
	 * Get default preferences
	 * @returns {UserListPreferences}
	 * Default UserListPreferences
	 */
	getDefaultPreferences(): UserListPreferences
	{
		return { ...DEFAULT_PREFERENCES };
	}

	/**
	 * Reset preferences to defaults
	 * @returns {void}
	 */
	resetPreferences(): void
	{
		this.storageService.removeItem(STORAGE_KEY);
	}

	/**
	 * Update specific preference
	 * @param {K} key
	 * Preference key to update
	 * @param {UserListPreferences[K]} value
	 * New value
	 * @returns {void}
	 */
	updatePreference<K extends keyof UserListPreferences>(
		key: K,
		value: UserListPreferences[K]): void
	{
		const current: UserListPreferences =
			this.loadPreferences();
		current[key] = value;
		this.savePreferences(current);
	}
}
