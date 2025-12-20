/**
 * User list preferences interface.
 */
export interface UserListPreferences
{
	displayedColumns: string[];
	searchFilter: string;
	statusFilter: "all" | "active" | "inactive";
	chartExpanded: boolean;
}
