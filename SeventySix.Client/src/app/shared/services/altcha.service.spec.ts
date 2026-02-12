/**
 * Altcha Service unit tests.
 * Tests ALTCHA challenge endpoint and enabled state access.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { AltchaService } from "./altcha.service";

describe("AltchaService",
	() =>
	{
		let service: AltchaService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection()
						]
					});

				service =
					TestBed.inject(AltchaService);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should return enabled status from environment config",
			() =>
			{
				expect(service.enabled)
					.toBe(environment.altcha.enabled);
			});

		it("should return correct challenge endpoint URL",
			() =>
			{
				const expectedUrl: string =
					`${environment.apiUrl}/altcha/challenge`;

				expect(service.challengeEndpoint)
					.toBe(expectedUrl);
			});
	});
