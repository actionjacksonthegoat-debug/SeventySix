import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from "@angular/material/button";
import { HealthApiService } from "../../../services/health-api.service";
import { HealthStatus } from "../../../../../core/models/admin/health-status.model";

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
	isLoading = signal(false);
	error = signal<string | null>(null);
	healthData = signal<HealthStatus | null>(null);

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
		const apis = this.healthData()?.externalApis.apis;
		return apis ? Object.keys(apis) : [];
	}
}
