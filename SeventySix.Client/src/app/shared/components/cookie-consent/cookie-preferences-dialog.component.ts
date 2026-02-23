import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { CookieConsentService } from "@shared/services/cookie-consent.service";

@Component(
	{
		selector: "app-cookie-preferences-dialog",
		imports: [
			MatDialogModule,
			MatButtonModule,
			MatCheckboxModule,
			MatDividerModule
		],
		templateUrl: "./cookie-preferences-dialog.component.html",
		styleUrl: "./cookie-preferences-dialog.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
/**
 * Cookie preferences dialog.
 *
 * Allows users to set granular consent per category.
 * Opened from the cookie consent banner or the footer "Cookie Settings" link.
 */
export class CookiePreferencesDialogComponent
{
	private readonly consentService: CookieConsentService =
		inject(CookieConsentService);
	private readonly dialogRef: MatDialogRef<CookiePreferencesDialogComponent> =
		inject(
		MatDialogRef<CookiePreferencesDialogComponent>);

	/**
	 * Functional cookies toggle state (initialized from current preferences).
	 */
	readonly functional: WritableSignal<boolean> =
		signal(this.consentService.preferences()?.functional ?? false);

	/**
	 * Analytics cookies toggle state (initialized from current preferences).
	 */
	readonly analytics: WritableSignal<boolean> =
		signal(this.consentService.preferences()?.analytics ?? false);

	/**
	 * Save the current signal values as custom preferences and close the dialog.
	 * @returns {void}
	 */
	save(): void
	{
		this.consentService.saveCustomPreferences(
			this.functional(),
			this.analytics());
		this.dialogRef.close();
	}

	/**
	 * Accept all categories and close the dialog.
	 * @returns {void}
	 */
	protected acceptAll(): void
	{
		this.consentService.acceptAll();
		this.dialogRef.close();
	}
}