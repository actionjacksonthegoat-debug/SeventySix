import {
	Component,
	ChangeDetectionStrategy,
	input,
	computed,
	signal,
	WritableSignal,
	InputSignal,
	Signal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { WeatherAlert } from "@home/weather/models";

/**
 * Component displaying government weather alerts in a sticky banner
 * Supports dismissal with localStorage persistence and severity-based coloring
 */
@Component({
	selector: "app-weather-alerts",
	imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
	templateUrl: "./weather-alerts.component.html",
	styleUrl: "./weather-alerts.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: "weather-alerts-container"
	}
})
export class WeatherAlertsComponent
{
	private readonly STORAGE_KEY: string = "dismissedAlerts";
	private readonly dismissedAlerts: WritableSignal<Set<string>> = signal<
		Set<string>
	>(this.loadDismissedAlerts());

	// Inputs
	readonly alerts: InputSignal<WeatherAlert[] | undefined> = input<
		WeatherAlert[] | undefined
	>(undefined);

	// Computed values
	readonly visibleAlerts: Signal<WeatherAlert[]> = computed(() =>
	{
		const allAlerts: WeatherAlert[] = this.alerts() || [];
		const dismissed: Set<string> = this.dismissedAlerts();

		return allAlerts.filter((alert) =>
		{
			const key: string = this.getAlertKey(alert);
			return !dismissed.has(key);
		});
	});

	/**
	 * Dismiss an alert and persist to localStorage
	 */
	dismissAlert(index: number): void
	{
		const alert: WeatherAlert | undefined = this.visibleAlerts()[index];
		if (!alert) return;

		const key: string = this.getAlertKey(alert);
		const dismissed: Set<string> = new Set(this.dismissedAlerts());
		dismissed.add(key);

		this.dismissedAlerts.set(dismissed);
		this.saveDismissedAlerts(dismissed);
	}

	/**
	 * Get severity level from event name
	 */
	getSeverity(
		event: string
	): "warning" | "advisory" | "watch" | "statement" | "default"
	{
		const eventLower: string = event.toLowerCase();

		if (eventLower.includes("warning")) return "warning";
		if (eventLower.includes("advisory")) return "advisory";
		if (eventLower.includes("watch")) return "watch";
		if (eventLower.includes("statement")) return "statement";

		return "default";
	}

	/**
	 * Format Unix timestamp to 12-hour time string
	 */
	formatAlertTime(timestamp: number): string
	{
		const date: Date = new Date(timestamp * 1000);
		let hours: number = date.getHours();
		const minutes: string = date.getMinutes().toString().padStart(2, "0");
		const ampm: string = hours >= 12 ? "PM" : "AM";
		hours = hours % 12 || 12;
		return `${hours}:${minutes} ${ampm}`;
	}

	/**
	 * Generate unique key for alert (event + start time)
	 */
	private getAlertKey(alert: WeatherAlert): string
	{
		return `${alert.event}_${alert.start}`;
	}

	/**
	 * Load dismissed alerts from localStorage
	 */
	private loadDismissedAlerts(): Set<string>
	{
		try
		{
			const stored: string | null = localStorage.getItem(
				this.STORAGE_KEY
			);
			if (!stored) return new Set();

			const parsed: string[] = JSON.parse(stored) as string[];
			return new Set(parsed);
		}
		catch
		{
			return new Set();
		}
	}

	/**
	 * Save dismissed alerts to localStorage
	 */
	private saveDismissedAlerts(dismissed: Set<string>): void
	{
		try
		{
			const array: string[] = Array.from(dismissed);
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(array));
		}
		catch
		{
			// Silently fail if localStorage is unavailable
		}
	}
}
