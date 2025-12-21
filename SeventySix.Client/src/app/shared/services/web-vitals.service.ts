import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { LoggerService } from "@shared/services/logger.service";
import { Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

/**
 * LCP entry details for diagnostic logging.
 */
interface LcpEntryDetails
{
	element: string;
	url?: string;
	size: number;
	loadTime: number;
}

/**
 * Extended Metric type with optional entries array for LCP diagnostics.
 */
interface MetricWithEntries
{
	entries?: PerformanceEntry[];
}

/**
 * LargestContentfulPaint entry interface.
 */
interface LargestContentfulPaintEntry extends PerformanceEntry
{
	element?: Element;
	url?: string;
	size: number;
	loadTime: number;
}

/**
 * Web Vitals service for Core Web Vitals tracking.
 * Monitors LCP, INP, CLS, FCP, and TTFB metrics.
 * Follows KISS principle - logs metrics to console initially.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class WebVitalsService
{
	private readonly logger: LoggerService =
		inject(LoggerService);

	constructor()
	{
		if (!environment.ui.performance.enableMonitoring)
		{
			return;
		}

		this.initializeWebVitals();
	}

	/**
	 * Initializes Core Web Vitals monitoring.
	 * Automatically called on service construction.
	 */
	private initializeWebVitals(): void
	{
		try
		{
			// Largest Contentful Paint - measures loading performance
			onLCP(
				(metric: Metric): void =>
				{
					this.logMetric("LCP", metric);
				});

			// Interaction to Next Paint - measures interactivity
			onINP(
				(metric: Metric): void =>
				{
					this.logMetric("INP", metric);
				});

			// Cumulative Layout Shift - measures visual stability
			onCLS(
				(metric: Metric): void =>
				{
					this.logMetric("CLS", metric);
				});

			// First Contentful Paint - measures perceived load speed
			onFCP(
				(metric: Metric): void =>
				{
					this.logMetric("FCP", metric);
				});

			// Time to First Byte - measures server response time
			onTTFB(
				(metric: Metric): void =>
				{
					this.logMetric("TTFB", metric);
				});
		}
		catch (error: unknown)
		{
			this.logger.error(
				"Failed to initialize Web Vitals",
				error instanceof Error ? error : undefined);
		}
	}

	/**
	 * Logs a web vitals metric with context.
	 * Only logs warning for poor metrics - good/needs-improvement are silent.
	 */
	private logMetric(name: string, metric: Metric): void
	{
		const rating: "good" | "needs-improvement" | "poor" =
			metric.rating || "good";

		// Only log warning for poor metrics
		if (rating === "poor")
		{
			const diagnosticData: Record<string, unknown> =
				{
					value: metric.value,
					threshold: this.getThreshold(name)
				};

			// Add LCP element details for diagnosis
			if (name === "LCP")
			{
				const metricEntries: PerformanceEntry[] =
					(metric as MetricWithEntries).entries ?? [];

				diagnosticData["lcpElements"] =
					metricEntries.map(
						(entry: PerformanceEntry) =>
							this.extractLcpEntryDetails(entry));
			}

			this.logger.warning(`Poor ${name} detected`, diagnosticData);
		}
	}

	/**
	 * Extracts diagnostic details from an LCP performance entry.
	 */
	private extractLcpEntryDetails(entry: PerformanceEntry): LcpEntryDetails
	{
		const lcpEntry: LargestContentfulPaintEntry =
			entry as LargestContentfulPaintEntry;

		return {
			element: lcpEntry.element?.tagName ?? "unknown",
			url: lcpEntry.url ?? undefined,
			size: lcpEntry.size,
			loadTime: lcpEntry.loadTime
		};
	}

	/**
	 * Gets the threshold for a metric (for reference).
	 */
	private getThreshold(name: string): string
	{
		const thresholds: Record<string, string> =
			{
				LCP: "2.5s (good) / 4.0s (poor)",
				INP: "200ms (good) / 500ms (poor)",
				CLS: "0.1 (good) / 0.25 (poor)",
				FCP: "1.8s (good) / 3.0s (poor)",
				TTFB: "800ms (good) / 1800ms (poor)"
			};

		return thresholds[name] || "unknown";
	}
}
