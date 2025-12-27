import {
	countStackFrames,
	formatJsonProperties,
	getLogLevelClassName,
	getLogLevelIconName,
	getLogLevelName,
	getRelativeTime,
	isRootSpanId,
	LogDto,
	LogLevel,
	parseLogLevel
} from "@admin/logs/models";
import { Clipboard } from "@angular/cdk/clipboard";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	output,
	OutputEmitterRef,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
	MAT_DIALOG_DATA,
	MatDialogModule,
	MatDialogRef
} from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { environment } from "@environments/environment";
import { DateService } from "@shared/services";

/** Dialog component for displaying detailed log information. */
@Component(
	{
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
	/**
	 * Reference to the active material dialog instance used to close the dialog.
	 * @type {MatDialogRef<LogDetailDialogComponent>}
	 */
	private readonly dialogRef: MatDialogRef<LogDetailDialogComponent> =
		inject(
	MatDialogRef<LogDetailDialogComponent>);

	/**
	 * Clipboard utility used to copy log payloads to the clipboard.
	 * @type {Clipboard}
	 * @private
	 * @readonly
	 */
	private readonly clipboard: Clipboard =
		inject(Clipboard);

	/**
	 * Date service used to format and compute relative times for display.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * The log entry provided to the dialog via `MAT_DIALOG_DATA`.
	 * @type {WritableSignal<LogDto>}
	 */
	readonly log: WritableSignal<LogDto> =
		signal<LogDto>(
			inject<LogDto>(MAT_DIALOG_DATA));

	/**
	 * Controls whether the stack trace is collapsed in the UI.
	 * @type {WritableSignal<boolean>}
	 */
	readonly stackTraceCollapsed: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Controls whether properties are collapsed in the UI.
	 * @type {WritableSignal<boolean>}
	 */
	readonly propertiesCollapsed: WritableSignal<boolean> =
		signal<boolean>(true);

	/**
	 * Controls whether the exception panel is collapsed.
	 * @type {WritableSignal<boolean>}
	 */
	readonly exceptionCollapsed: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Event emitter that emits when the user requests deletion of this log.
	 * @type {OutputEmitterRef<number>}
	 */
	/**
	 * Event emitted when the user requests deletion of this log.
	 * Emitted value is the numeric ID of the log to delete.
	 * @type {OutputEmitterRef<number>}
	 */
	readonly deleteLog: OutputEmitterRef<number> =
		output<number>();

	// Pre-computed values for template performance (memoized computed signals)
	/**
	 * CSS class name for the log level (used for styling badges).
	 * @type {Signal<string>}
	 */
	/**
	 * CSS class name for the log level (used for styling badges).
	 * @type {Signal<string>}
	 */
	readonly levelClass: Signal<string> =
		computed(
			(): string =>
				getLogLevelClassName(this.log().logLevel));

	/**
	 * Human-friendly level name (e.g., 'Error', 'Warning').
	 * @type {Signal<string>}
	 */
	readonly levelName: Signal<string> =
		computed(
			(): string =>
				getLogLevelName(this.log().logLevel));

	/**
	 * Icon name used for the log level (material icon key).
	 * @type {Signal<string>}
	 */
	readonly levelIcon: Signal<string> =
		computed(
			(): string =>
				getLogLevelIconName(this.log().logLevel));

	/**
	 * Relative time string for when the log was created (e.g., '5 minutes ago').
	 * @type {Signal<string>}
	 */
	readonly relativeTime: Signal<string> =
		computed(
			(): string =>
				getRelativeTime(
					this.log().createDate,
					this.dateService));

	/**
	 * Formatted JSON properties string for display.
	 * @type {Signal<string>}
	 */
	readonly formattedProperties: Signal<string> =
		computed(
			(): string =>
				formatJsonProperties(this.log().properties));

	/**
	 * Number of stack frames in the log's stack trace.
	 * @type {Signal<number>}
	 */
	readonly stackFrameCount: Signal<number> =
		computed(
			(): number =>
				countStackFrames(this.log().stackTrace));

	/**
	 * True if the log's span is the root span for a trace.
	 * @type {Signal<boolean>}
	 */
	readonly isRootSpan: Signal<boolean> =
		computed(
			(): boolean =>
				isRootSpanId(this.log().parentSpanId));

	/**
	 * True when a correlation/trace ID is present on the log entry.
	 * @type {Signal<boolean>}
	 */
	readonly hasCorrelationId: Signal<boolean> =
		computed(
			(): boolean =>
				!!this.log().correlationId);

	/**
	 * True when the log level is Error or Fatal.
	 * @type {Signal<boolean>}
	 */
	readonly isError: Signal<boolean> =
		computed(
			(): boolean =>
			{
				const level: LogLevel =
					parseLogLevel(this.log().logLevel);
				return level === LogLevel.Error || level === LogLevel.Fatal;
			});

	/**
	 * Toggle the stack trace section collapsed state.
	 * @returns {void}
	 */
	toggleStackTrace(): void
	{
		this.stackTraceCollapsed.set(!this.stackTraceCollapsed());
	}

	/**
	 * Toggle the properties section collapsed state.
	 * @returns {void}
	 */
	toggleProperties(): void
	{
		this.propertiesCollapsed.set(!this.propertiesCollapsed());
	}

	/**
	 * Toggle the exception details section collapsed state.
	 * @returns {void}
	 */
	toggleException(): void
	{
		this.exceptionCollapsed.set(!this.exceptionCollapsed());
	}

	/**
	 * Copy the current log payload to clipboard as formatted JSON.
	 * @returns {void}
	 */
	copyToClipboard(): void
	{
		const logData: string =
			JSON.stringify(this.log(), null, 2);
		this.clipboard.copy(logData);
	}

	/**
	 * Handler for Escape key - closes the dialog.
	 * @returns {void}
	 */
	handleEscape(): void
	{
		this.onClose();
	}

	/**
	 * Emit delete event and close the dialog.
	 * @returns {void}
	 */
	onDelete(): void
	{
		this.deleteLog.emit(this.log().id);
		this.dialogRef.close();
	}

	/**
	 * Close the dialog without taking action.
	 * @returns {void}
	 */
	onClose(): void
	{
		this.dialogRef.close();
	}

	/**
	 * Opens Jaeger UI to view the specific trace for this log entry.
	 * Shows an alert if no correlation ID is available and provides guidance
	 * to enable distributed tracing in the backend.
	 * @returns {void}
	 */
	openInJaeger(): void
	{
		const log: LogDto =
			this.log();

		if (!log.correlationId)
		{
			alert(
				"No trace ID available for this error.\n\n"
					+ "To enable distributed tracing:\n"
					+ "1. Configure OpenTelemetry in your backend\n"
					+ "2. Ensure trace IDs are propagated through requests\n"
					+ "3. Verify Jaeger is running (npm run start:observability)\n"
					+ "4. Check that your API is exporting traces to Jaeger");
			return;
		}

		const jaegerUrl: string =
			environment.observability.jaegerUrl || "http://localhost:16686";
		const url: string =
			`${jaegerUrl}/trace/${log.correlationId}`;
		window.open(url, "_blank");
	}
}
