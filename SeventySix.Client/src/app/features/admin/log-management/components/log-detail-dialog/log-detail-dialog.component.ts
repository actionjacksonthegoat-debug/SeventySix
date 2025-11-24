import {
	Component,
	ChangeDetectionStrategy,
	inject,
	signal,
	output,
	OutputEmitterRef,
	WritableSignal
} from "@angular/core";
import {
	MAT_DIALOG_DATA,
	MatDialogModule,
	MatDialogRef
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatExpansionModule } from "@angular/material/expansion";
import { Clipboard } from "@angular/cdk/clipboard";
import {
	LogResponse,
	LogLevel,
	parseLogLevel
} from "@admin/log-management/models";
import { environment } from "@environments/environment";

/**
 * Dialog component for displaying detailed log information
 */
@Component({
	selector: "app-log-detail-dialog",
	imports: [
		MatDialogModule,
		MatButtonModule,
		MatIconModule,
		MatDividerModule,
		MatTooltipModule,
		MatExpansionModule
	],
	templateUrl: "./log-detail-dialog.component.html",
	styleUrl: "./log-detail-dialog.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogDetailDialogComponent
{
	private readonly dialogRef: MatDialogRef<LogDetailDialogComponent> = inject(
		MatDialogRef<LogDetailDialogComponent>
	);
	private readonly clipboard: Clipboard = inject(Clipboard);

	readonly log: WritableSignal<LogResponse> = signal<LogResponse>(
		inject<LogResponse>(MAT_DIALOG_DATA)
	);
	readonly stackTraceCollapsed: WritableSignal<boolean> =
		signal<boolean>(false);
	readonly propertiesCollapsed: WritableSignal<boolean> =
		signal<boolean>(true);
	readonly exceptionCollapsed: WritableSignal<boolean> =
		signal<boolean>(false);

	readonly deleteLog: OutputEmitterRef<number> = output<number>();

	// Observability integration
	readonly isObservabilityEnabled: boolean =
		environment.observability.enabled;

	/**
	 * Checks if this log entry is an error (Error or Fatal level)
	 */
	isError(): boolean
	{
		const log: LogResponse = this.log();
		const level: LogLevel = parseLogLevel(log.logLevel);
		return level === LogLevel.Error || level === LogLevel.Fatal;
	}

	/**
	 * Checks if this log entry has a correlation ID for tracing
	 */
	hasCorrelationId(): boolean
	{
		const log: LogResponse = this.log();
		return !!log.correlationId;
	}

	/**
	 * Checks if a parent span ID represents a root span (all zeros)
	 */
	isRootSpan(parentSpanId: string | null): boolean
	{
		if (!parentSpanId)
		{
			return false;
		}
		// Root spans have a parent span ID of all zeros
		return /^0+$/.test(parentSpanId);
	}

	getLevelName(logLevel: string): string
	{
		const level: LogLevel = parseLogLevel(logLevel);
		const names: Record<LogLevel, string> = {
			[LogLevel.Verbose]: "Verbose",
			[LogLevel.Debug]: "Debug",
			[LogLevel.Information]: "Info",
			[LogLevel.Warning]: "Warning",
			[LogLevel.Error]: "Error",
			[LogLevel.Fatal]: "Fatal"
		};
		return names[level];
	}

	getLevelIcon(logLevel: string): string
	{
		const level: LogLevel = parseLogLevel(logLevel);
		const icons: Record<LogLevel, string> = {
			[LogLevel.Verbose]: "bug_report",
			[LogLevel.Debug]: "bug_report",
			[LogLevel.Information]: "info",
			[LogLevel.Warning]: "warning",
			[LogLevel.Error]: "error",
			[LogLevel.Fatal]: "cancel"
		};
		return icons[level];
	}

	getLevelClass(logLevel: string): string
	{
		const level: LogLevel = parseLogLevel(logLevel);
		const classes: Record<LogLevel, string> = {
			[LogLevel.Verbose]: "level-verbose",
			[LogLevel.Debug]: "level-debug",
			[LogLevel.Information]: "level-info",
			[LogLevel.Warning]: "level-warning",
			[LogLevel.Error]: "level-error",
			[LogLevel.Fatal]: "level-fatal"
		};
		return classes[level];
	}

	getRelativeTime(date: Date | string): string
	{
		const dateObj: Date = typeof date === "string" ? new Date(date) : date;
		const now: number = Date.now();
		const diff: number = now - dateObj.getTime();
		const minutes: number = Math.floor(diff / 60000);
		const hours: number = Math.floor(diff / 3600000);
		const days: number = Math.floor(diff / 86400000);

		if (days > 0)
		{
			return `${days} day${days > 1 ? "s" : ""} ago`;
		}
		if (hours > 0)
		{
			return `${hours} hour${hours > 1 ? "s" : ""} ago`;
		}
		if (minutes > 0)
		{
			return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
		}
		return "just now";
	}

	formatStackTrace(stackTrace: string | null): string
	{
		if (!stackTrace)
		{
			return "";
		}
		return stackTrace;
	}

	formatProperties(properties: Record<string, unknown> | null): string
	{
		if (!properties)
		{
			return "";
		}
		return JSON.stringify(properties, null, 2);
	}

	toggleStackTrace(): void
	{
		this.stackTraceCollapsed.set(!this.stackTraceCollapsed());
	}

	toggleProperties(): void
	{
		this.propertiesCollapsed.set(!this.propertiesCollapsed());
	}

	toggleException(): void
	{
		this.exceptionCollapsed.set(!this.exceptionCollapsed());
	}

	/**
	 * Extracts the primary exception message from the full exception string
	 */
	getExceptionMessage(exception: string | null): string
	{
		if (!exception)
		{
			return "";
		}

		// Try to extract first line (usually the main message)
		const lines: string[] = exception.split("\n");
		const firstLine: string = lines[0].trim();

		// If it contains a colon, the message is after the colon
		const colonIndex: number = firstLine.indexOf(":");
		if (colonIndex > -1)
		{
			return firstLine.substring(colonIndex + 1).trim();
		}

		return firstLine;
	}

	/**
	 * Extracts the exception type from the full exception string
	 */
	getExceptionType(exception: string | null): string | null
	{
		if (!exception)
		{
			return null;
		}

		// Try to extract exception type (usually before first colon)
		const lines: string[] = exception.split("\n");
		const firstLine: string = lines[0].trim();

		const colonIndex: number = firstLine.indexOf(":");
		if (colonIndex > -1)
		{
			return firstLine.substring(0, colonIndex).trim();
		}

		// Check if first line looks like an exception type
		if (firstLine.includes("Exception") || firstLine.includes("Error"))
		{
			return firstLine;
		}

		return null;
	}

	/**
	 * Extracts base exception message if present
	 */
	getBaseException(exception: string | null): string | null
	{
		if (!exception)
		{
			return null;
		}

		// Look for common base exception patterns
		const basePattern: RegExp = /---> (.+?):/;
		const match: RegExpMatchArray | null = exception.match(basePattern);

		if (match && match[1])
		{
			return match[1].trim();
		}

		return null;
	}

	/**
	 * Extracts inner exceptions from the full exception string
	 */
	getInnerExceptions(exception: string | null): string[]
	{
		if (!exception)
		{
			return [];
		}

		const innerExceptions: string[] = [];

		// Look for inner exception markers
		const innerPattern: RegExp = /---> (.+?)(?:\r?\n|$)/g;
		let match: RegExpExecArray | null;

		while ((match = innerPattern.exec(exception)) !== null)
		{
			if (match[1])
			{
				innerExceptions.push(match[1].trim());
			}
		}

		return innerExceptions;
	}

	/**
	 * Counts the number of stack frames in the stack trace
	 */
	getStackFrameCount(stackTrace: string | null): number
	{
		if (!stackTrace)
		{
			return 0;
		}

		// Count lines that start with "at " (typical .NET stack trace format)
		const lines: string[] = stackTrace.split("\n");
		return lines.filter((line) => line.trim().startsWith("at ")).length;
	}

	copyToClipboard(): void
	{
		const logData: string = JSON.stringify(this.log(), null, 2);
		this.clipboard.copy(logData);
	}

	/**
	 * Keyboard shortcut handler
	 * ESC: Close dialog
	 */
	handleEscape(): void
	{
		this.onClose();
	}

	onDelete(): void
	{
		this.deleteLog.emit(this.log().id);
		this.dialogRef.close();
	}

	onClose(): void
	{
		this.dialogRef.close();
	}

	/**
	 * Opens Jaeger UI to view the specific trace for this error
	 * Shows alert if no correlation ID is available
	 */
	openInJaeger(): void
	{
		const log: LogResponse = this.log();

		if (!log.correlationId)
		{
			alert(
				"No trace ID available for this error.\n\n" +
					"To enable distributed tracing:\n" +
					"1. Configure OpenTelemetry in your backend\n" +
					"2. Ensure trace IDs are propagated through requests\n" +
					"3. Verify Jaeger is running (npm run start:observability)\n" +
					"4. Check that your API is exporting traces to Jaeger"
			);
			return;
		}

		const jaegerUrl: string =
			environment.observability.jaegerUrl || "http://localhost:16686";
		const url: string = `${jaegerUrl}/trace/${log.correlationId}`;
		window.open(url, "_blank");
	}
}
