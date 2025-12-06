import { Component, ChangeDetectionStrategy } from "@angular/core";
import { LogList } from "@admin/logs/components";
import { PageHeaderComponent } from "@shared/components";

/**
 * Log Management page.
 * Smart container for log management functionality.
 * Provides page layout and hosts the LogList component.
 */
@Component({
	selector: "app-log-management-page",
	imports: [LogList, PageHeaderComponent],
	templateUrl: "./log-management.html",
	styleUrl: "./log-management.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogManagementPage
{}
