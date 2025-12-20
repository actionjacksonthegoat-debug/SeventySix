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
	private readonly storageService: StorageService =
		inject(StorageService);

	/**
	 * Load user preferences from storage
	 * @returns UserListPreferences or defaults if none found
	 */
	loadPreferences(): UserListPreferences
	{
		const stored: UserListPreferences | null =
			this.storageService.getItem<UserListPreferences>(STORAGE_KEY);
		return stored || DEFAULT_PREFERENCES;
	}

	/**
	 * Save user preferences to storage
	 * @param preferences - Preferences to save
	 */
	savePreferences(preferences: UserListPreferences): void
	{
		this.storageService.setItem(STORAGE_KEY, preferences);
	}

	/**
	 * Reset preferences to defaults
	 */
	resetPreferences(): void
	{
		this.storageService.removeItem(STORAGE_KEY);
	}

	/**
	 * Get default preferences
	 * @returns Default UserListPreferences
	 */
	getDefaultPreferences(): UserListPreferences
	{
		return { ...DEFAULT_PREFERENCES };
	}

	/**
	 * Update specific preference
	 * @param key - Preference key to update
	 * @param value - New value
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
