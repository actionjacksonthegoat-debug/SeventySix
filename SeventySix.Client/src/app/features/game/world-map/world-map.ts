import { Component, ChangeDetectionStrategy } from "@angular/core";
import { UserList } from "@features/admin/users/components/user-list/user-list";

/**
 * World map container component.
 * Smart component that handles state and delegates display to presentational components.
 * Follows Smart/Presentational component pattern.
 */
@Component({
	selector: "app-world-map",
	imports: [UserList],
	templateUrl: "./world-map.html",
	styleUrl: "./world-map.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorldMap
{}
