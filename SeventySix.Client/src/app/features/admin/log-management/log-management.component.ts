import {
	Component,
	signal,
	WritableSignal,
	ChangeDetectionStrategy
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { LogList } from "@admin/log-management/components";

/**
 * Log Management component.
 * Smart container for log management functionality.
 * Provides page layout and hosts the LogList component.
 * Follows Smart/Presentational component pattern for separation of concerns.
 */
@Component({
	selector: "app-log-management",
	standalone: true,
	imports: [MatIconModule, MatButtonModule, LogList],
	templateUrl: "./log-management.component.html",
	styleUrl: "./log-management.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogManagementComponent
{
	// Page-level state
	readonly pageTitle: WritableSignal<string> = signal("Log Management");
}
