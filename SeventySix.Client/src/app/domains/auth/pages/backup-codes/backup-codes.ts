/**
 * Backup codes page for generating and displaying emergency MFA recovery codes.
 * Provides copy, print, and download functionality.
 */

import { Clipboard } from "@angular/cdk/clipboard";
import { HttpErrorResponse } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnInit,
	signal,
	WritableSignal
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { Router } from "@angular/router";
import { CLIPBOARD_RESET_DELAY_MS } from "@auth/constants";
import { BackupCodesService } from "@auth/services";
import { APP_ROUTES } from "@shared/constants";
import { DateService, NotificationService } from "@shared/services";

/**
 * Number of backup codes to generate.
 */
const BACKUP_CODE_COUNT: number = 10;

/**
 * Setup step identifiers.
 */
const STEP_LOADING: number = 0;
const STEP_WARNING: number = 1;
const STEP_CODES: number = 2;
const STEP_CONFIRM: number = 3;

@Component(
	{
		selector: "app-backup-codes",
		standalone: true,
		imports: [MatButtonModule, MatIconModule],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./backup-codes.html",
		styleUrl: "./backup-codes.scss"
	})
/**
 * Component for generating and displaying MFA backup codes.
 * Allows users to copy, print, or download their backup codes.
 */
export class BackupCodesComponent implements OnInit
{
	/**
	 * Backup codes service for generation operations.
	 * @type {BackupCodesService}
	 * @private
	 * @readonly
	 */
	private readonly backupCodesService: BackupCodesService =
		inject(BackupCodesService);

	/**
	 * Clipboard service for copy operations.
	 * @type {Clipboard}
	 * @private
	 * @readonly
	 */
	private readonly clipboard: Clipboard =
		inject(Clipboard);

	/**
	 * Router for navigation.
	 * @type {Router}
	 * @private
	 * @readonly
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Date service for date operations.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * Notification service for user feedback.
	 * @type {NotificationService}
	 * @private
	 * @readonly
	 */
	private readonly notification: NotificationService =
		inject(NotificationService);

	/**
	 * Current step in the backup codes flow.
	 * 0 = loading, 1 = warning, 2 = codes display, 3 = confirm saved
	 * @type {WritableSignal<number>}
	 * @protected
	 * @readonly
	 */
	protected readonly currentStep: WritableSignal<number> =
		signal<number>(STEP_WARNING);

	/**
	 * Whether an API request is in progress.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Generated backup codes.
	 * @type {WritableSignal<string[]>}
	 * @protected
	 * @readonly
	 */
	protected readonly codes: WritableSignal<string[]> =
		signal<string[]>([]);

	/**
	 * Whether codes have been copied.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly codesCopied: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Error message from API.
	 * @type {WritableSignal<string>}
	 * @protected
	 * @readonly
	 */
	protected readonly errorMessage: WritableSignal<string> =
		signal<string>("");

	/**
	 * Whether the user has acknowledged saving the codes.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly hasSavedCodes: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Step constants for template use.
	 */
	protected readonly STEP_LOADING: number = STEP_LOADING;
	protected readonly STEP_WARNING: number = STEP_WARNING;
	protected readonly STEP_CODES: number = STEP_CODES;
	protected readonly STEP_CONFIRM: number = STEP_CONFIRM;
	protected readonly CODE_COUNT: number = BACKUP_CODE_COUNT;

	/**
	 * Initializes the component. Does not auto-generate codes.
	 * @returns {void}
	 */
	ngOnInit(): void
	{
		// Start at warning step, user must acknowledge before generating
	}

	/**
	 * Generates new backup codes after user confirms.
	 * @returns {void}
	 * @protected
	 */
	protected onGenerateCodes(): void
	{
		this.isLoading.set(true);
		this.errorMessage.set("");
		this.currentStep.set(STEP_LOADING);

		this
			.backupCodesService
			.generate()
			.subscribe(
				{
					next: (codes: string[]) =>
					{
						this.codes.set(codes);
						this.currentStep.set(STEP_CODES);
						this.isLoading.set(false);
					},
					error: (error: HttpErrorResponse) =>
					{
						this.handleError(error, "Failed to generate backup codes");
						this.currentStep.set(STEP_WARNING);
						this.isLoading.set(false);
					}
				});
	}

	/**
	 * Handles API errors by extracting message and showing notification.
	 * @param {HttpErrorResponse} error
	 * The HTTP error response.
	 * @param {string} fallbackMessage
	 * Default message if none in response.
	 * @returns {void}
	 * @private
	 */
	private handleError(
		error: HttpErrorResponse,
		fallbackMessage: string): void
	{
		const message: string =
			error.error?.message
				?? error.error?.title
				?? fallbackMessage;
		this.errorMessage.set(message);
		this.notification.error(message);
	}

	/**
	 * Copies all backup codes to clipboard.
	 * @returns {void}
	 * @protected
	 */
	protected onCopyCodes(): void
	{
		const codesText: string =
			this.formatCodesForCopy();
		const success: boolean =
			this.clipboard.copy(codesText);

		if (success)
		{
			this.codesCopied.set(true);
			this.notification.success("Backup codes copied to clipboard");

			// Reset copied state after delay
			setTimeout(
				() => this.codesCopied.set(false),
				CLIPBOARD_RESET_DELAY_MS);
		}
		else
		{
			this.notification.error("Failed to copy to clipboard");
		}
	}

	/**
	 * Formats codes for clipboard with header.
	 * @returns {string}
	 * Formatted codes text.
	 * @private
	 */
	private formatCodesForCopy(): string
	{
		const generatedDate: string =
			this.dateService.formatLocal(this.dateService.nowDate(), "PP");
		const header: string =
			"SeventySix Backup Codes\n"
				+ "Generated: "
				+ generatedDate
				+ "\n"
				+ "========================\n\n";
		const codesText: string =
			this
				.codes()
				.join("\n");
		const footer: string =
			"\n\n========================\n"
				+ "Store these codes safely. Each code can only be used once.";

		return header + codesText + footer;
	}

	/**
	 * Prints the backup codes.
	 * @returns {void}
	 * @protected
	 */
	protected onPrintCodes(): void
	{
		const printWindow: Window | null =
			window.open("", "_blank");

		if (!printWindow)
		{
			this.notification.error("Could not open print window. Please allow pop-ups.");
			return;
		}

		const html: string =
			this.generatePrintHtml();

		printWindow.document.write(html);
		printWindow.document.close();
		printWindow.print();
	}

	/**
	 * Generates HTML for print page.
	 * @returns {string}
	 * HTML content for printing.
	 * @private
	 */
	private generatePrintHtml(): string
	{
		const codesHtml: string =
			this.generateCodesTableHtml();
		const styles: string =
			this.getPrintStyles();
		const date: string =
			this.dateService.formatLocal(this.dateService.nowDate(), "PP");

		return `<!DOCTYPE html><html><head><title>SeventySix Backup Codes</title>`
			+ `<style>${styles}</style></head><body>`
			+ `<h1>SeventySix Backup Codes</h1>`
			+ `<p class="date">Generated: ${date}</p>`
			+ `<table>${codesHtml}</table>`
			+ `<div class="warning"><strong>Important:</strong> Store these codes in a safe place. `
			+ `Each code can only be used once.</div></body></html>`;
	}

	/**
	 * Generates the codes table rows HTML.
	 * @returns {string}
	 * HTML table rows for codes.
	 * @private
	 */
	private generateCodesTableHtml(): string
	{
		return this
			.codes()
			.map(
				(code: string, index: number) =>
					`<tr><td>${index + 1}.</td><td><code>${code}</code></td></tr>`)
			.join("");
	}

	/**
	 * Returns CSS styles for print page.
	 * @returns {string}
	 * CSS styles string.
	 * @private
	 */
	private getPrintStyles(): string
	{
		return `body{font-family:Arial,sans-serif;padding:2rem;max-width:500px;margin:0 auto}`
			+ `h1{font-size:1.5rem;margin-bottom:.5rem}.date{color:#666;margin-bottom:1.5rem}`
			+ `table{width:100%;border-collapse:collapse}td{padding:.5rem;border-bottom:1px solid #ddd}`
			+ `code{font-family:monospace;font-size:1.1rem;letter-spacing:.1rem}`
			+ `.warning{margin-top:1.5rem;padding:1rem;background:#fff3cd;border-radius:.25rem;font-size:.9rem}`;
	}

	/**
	 * Downloads backup codes as a text file.
	 * @returns {void}
	 * @protected
	 */
	protected onDownloadCodes(): void
	{
		const content: string =
			this.formatCodesForCopy();
		const blob: Blob =
			new Blob(
				[content],
				{ type: "text/plain" });
		const url: string =
			URL.createObjectURL(blob);
		const link: HTMLAnchorElement =
			document.createElement("a");

		link.href = url;
		link.download =
			`seventysix-backup-codes-${this.formatDate()}.txt`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		this.notification.success("Backup codes downloaded");
	}

	/**
	 * Formats current date for filename.
	 * @returns {string}
	 * Date string in YYYY-MM-DD format.
	 * @private
	 */
	private formatDate(): string
	{
		return this.dateService.formatLocal(this.dateService.nowDate(), "yyyy-MM-dd");
	}

	/**
	 * Proceeds to confirmation step.
	 * @returns {void}
	 * @protected
	 */
	protected onAcknowledgeSaved(): void
	{
		this.hasSavedCodes.set(true);
		this.currentStep.set(STEP_CONFIRM);
	}

	/**
	 * Completes the flow and navigates home.
	 * @returns {void}
	 * @protected
	 */
	protected onFinish(): void
	{
		this.router.navigate(
			[APP_ROUTES.HOME]);
	}

	/**
	 * Cancels and navigates back.
	 * @returns {void}
	 * @protected
	 */
	protected onCancel(): void
	{
		this.router.navigate(
			[APP_ROUTES.HOME]);
	}
}
