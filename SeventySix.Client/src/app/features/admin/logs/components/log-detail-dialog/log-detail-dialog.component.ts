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
import { DateService } from "@infrastructure/services";

/** Dialog component for displaying detailed log information. */
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
	private readonly dialogRef: MatDialogRef<LogDetailDialogComponent> =
		inject(
		MatDialogRef<LogDetailDialogComponent>);
	private readonly clipboard: Clipboard =
		inject(Clipboard);
	private readonly dateService: DateService =
		inject(DateService);

	readonly log: WritableSignal<LogDto> =
		signal<LogDto>(
		inject<LogDto>(MAT_DIALOG_DATA));
	readonly stackTraceCollapsed: WritableSignal<boolean> =
		signal<boolean>(false);
	readonly propertiesCollapsed: WritableSignal<boolean> =
		signal<boolean>(true);
	readonly exceptionCollapsed: WritableSignal<boolean> =
		signal<boolean>(false);

	readonly deleteLog: OutputEmitterRef<number> =
		output<number>();

	// Pre-computed values for template performance (memoized computed signals)
	readonly levelClass: Signal<string> =
		computed((): string =>
			getLogLevelClassName(this.log().logLevel));
	readonly levelName: Signal<string> =
		computed((): string =>
			getLogLevelName(this.log().logLevel));
	readonly levelIcon: Signal<string> =
		computed((): string =>
			getLogLevelIconName(this.log().logLevel));
	readonly relativeTime: Signal<string> =
		computed((): string =>
			getRelativeTime(
			this.log().createDate,
			this.dateService));
	readonly formattedProperties: Signal<string> =
		computed((): string =>
			formatJsonProperties(this.log().properties));
	readonly stackFrameCount: Signal<number> =
		computed((): number =>
			countStackFrames(this.log().stackTrace));
	readonly isRootSpan: Signal<boolean> =
		computed((): boolean =>
			isRootSpanId(this.log().parentSpanId));
	readonly hasCorrelationId: Signal<boolean> =
		computed(
		(): boolean =>
			!!this.log().correlationId);
	readonly isError: Signal<boolean> =
		computed((): boolean =>
	{
		const level: LogLevel =
			parseLogLevel(this.log().logLevel);
		return level === LogLevel.Error || level === LogLevel.Fatal;
	});

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

	copyToClipboard(): void
	{
		const logData: string =
			JSON.stringify(this.log(), null, 2);
		this.clipboard.copy(logData);
	}

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
