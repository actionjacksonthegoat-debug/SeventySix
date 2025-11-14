import {
	Component,
	ChangeDetectionStrategy,
	inject,
	signal,
	output,
	HostListener
} from "@angular/core";
import { NgClass } from "@angular/common";
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
import { LogResponse, LogLevel } from "@admin/log-management/models";

/**
 * Dialog component for displaying detailed log information
 */
@Component({
	selector: "app-log-detail-dialog",
	imports: [
		NgClass,
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
	private readonly dialogRef = inject(MatDialogRef<LogDetailDialogComponent>);
	private readonly clipboard = inject(Clipboard);

	log = signal(inject<LogResponse>(MAT_DIALOG_DATA));
	stackTraceCollapsed = signal(false);
	propertiesCollapsed = signal(true);

	deleteLog = output<number>();

	getLevelName(level: LogLevel): string
	{
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

	getLevelIcon(level: LogLevel): string
	{
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

	getLevelClass(level: LogLevel): string
	{
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
		const dateObj = typeof date === "string" ? new Date(date) : date;
		const now = Date.now();
		const diff = now - dateObj.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

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

	copyToClipboard(): void
	{
		const logData = JSON.stringify(this.log(), null, 2);
		this.clipboard.copy(logData);
	}

	/**
	 * Keyboard shortcut handler
	 * ESC: Close dialog
	 */
	@HostListener("window:keydown.escape")
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
}
