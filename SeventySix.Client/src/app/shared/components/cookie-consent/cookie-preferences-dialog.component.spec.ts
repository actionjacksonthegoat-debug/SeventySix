import { ComponentFixture } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CookieConsentPreferences } from "@shared/models/cookie-consent.model";
import { DateService } from "@shared/services";
import { CookieConsentService } from "@shared/services/cookie-consent.service";
import { createMockDialogRef } from "@testing/mock-factories";
import { ComponentTestBed } from "@testing/test-bed-builders";
import { vi } from "vitest";
import { CookiePreferencesDialogComponent } from "./cookie-preferences-dialog.component";

describe("CookiePreferencesDialogComponent",
	() =>
	{
		let component: CookiePreferencesDialogComponent;
		let fixture: ComponentFixture<CookiePreferencesDialogComponent>;
		let mockConsentService: Partial<CookieConsentService>;

		const defaultPreferences: CookieConsentPreferences =
			{
				strictlyNecessary: true,
				functional: false,
				analytics: false,
				version: "1.0",
				consentDate: new DateService()
					.now()
			};

		async function buildComponent(
			preferences?: CookieConsentPreferences): Promise<ComponentFixture<CookiePreferencesDialogComponent>>
		{
			mockConsentService =
				{
					preferences: vi
						.fn()
						.mockReturnValue(preferences ?? defaultPreferences) as unknown as CookieConsentService["preferences"],
					saveCustomPreferences: vi.fn()
				};

			return new ComponentTestBed<CookiePreferencesDialogComponent>()
				.withProvider(
					{ provide: MatDialogRef, useValue: createMockDialogRef() })
				.withProvider(
					{ provide: MAT_DIALOG_DATA, useValue: null })
				.withProvider(
					{ provide: CookieConsentService, useValue: mockConsentService })
				.build(CookiePreferencesDialogComponent);
		}

		it("initialises functional signal from current preferences",
			async () =>
			{
				fixture =
					await buildComponent(
						{ ...defaultPreferences, functional: true });
				component =
					fixture.componentInstance;

				expect(component.functional())
					.toBe(true);
			});

		it("initialises analytics signal from current preferences",
			async () =>
			{
				fixture =
					await buildComponent(
						{ ...defaultPreferences, analytics: true });
				component =
					fixture.componentInstance;

				expect(component.analytics())
					.toBe(true);
			});

		it("save calls consentService.saveCustomPreferences with signal values",
			async () =>
			{
				fixture =
					await buildComponent();
				component =
					fixture.componentInstance;

				component.functional.set(true);
				component.analytics.set(false);
				component.save();

				expect(mockConsentService.saveCustomPreferences)
					.toHaveBeenCalledWith(true, false);
			});

		it("save closes the dialog",
			async () =>
			{
				fixture =
					await buildComponent();
				component =
					fixture.componentInstance;
				const dialogRef: MatDialogRef<CookiePreferencesDialogComponent> =
					fixture.debugElement.injector.get(
						MatDialogRef);

				component.save();

				expect(dialogRef.close)
					.toHaveBeenCalledTimes(1);
			});

		it("strictly necessary checkbox is always checked and disabled",
			async () =>
			{
				fixture =
					await buildComponent();
				component =
					fixture.componentInstance;
				fixture.detectChanges();

				const checkbox: HTMLInputElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='checkbox-strictly-necessary'] input[type=checkbox]");
				expect(checkbox?.checked)
					.toBe(true);
				expect(checkbox?.disabled)
					.toBe(true);
			});
	});