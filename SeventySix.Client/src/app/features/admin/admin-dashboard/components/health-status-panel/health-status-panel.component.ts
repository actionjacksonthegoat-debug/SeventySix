import { Component, OnInit, signal, WritableSignal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from "@angular/material/button";
import { HealthApiService } from "@admin/admin-dashboard/services";
import { HealthStatus } from "@admin/admin-dashboard/models";

/**
 * Component displaying system health status panel
 */
@Component({
	selector: "app-health-status-panel",
	standalone: true,
	imports: [
		CommonModule,
		MatCardModule,
		MatChipsModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatButtonModule
	],
	templateUrl: "./health-status-panel.component.html",
	styleUrl: "./health-status-panel.component.scss"
})
export class HealthStatusPanelComponent implements OnInit
{
	readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);
	readonly error: WritableSignal<string | null> = signal<string | null>(null);
	readonly healthData: WritableSignal<HealthStatus | null> =
		signal<HealthStatus | null>(null);

	constructor(private healthApiService: HealthApiService)
	{}

	ngOnInit(): void
	{
		this.loadHealthData();
	}

	/**
	 * Load health data from service
	 */
	private loadHealthData(): void
	{
		this.isLoading.set(true);
		this.error.set(null);

		this.healthApiService.getHealth().subscribe({
			next: (data) =>
			{
				this.healthData.set(data);
				this.isLoading.set(false);
			},
			error: (err) =>
			{
				this.error.set(err.message || "Failed to load health data");
				this.healthData.set(null);
				this.isLoading.set(false);
			}
		});
	}

	/**
	 * Refresh health data
	 */
	onRefresh(): void
	{
		this.loadHealthData();
	}

	/**
	 * Get array of API names from external APIs
	 */
	getApiNames(): string[]
	{
		const apis: Record<string, unknown> | undefined =
			this.healthData()?.externalApis.apis;
		return apis ? Object.keys(apis) : [];
	}
}
