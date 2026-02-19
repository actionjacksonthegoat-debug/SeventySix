/**
 * Altcha Service unit tests.
 * Tests ALTCHA challenge endpoint and enabled state access.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { createMockFeatureFlagsService, MockFeatureFlagsService } from "@testing/mock-factories";
import { AltchaService } from "./altcha.service";
import { FeatureFlagsService } from "./feature-flags.service";

describe("AltchaService",
	() =>
	{
		let service: AltchaService;
		let mockFeatureFlags: MockFeatureFlagsService;

		beforeEach(
			() =>
			{
				mockFeatureFlags =
					createMockFeatureFlagsService();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							{ provide: FeatureFlagsService, useValue: mockFeatureFlags }
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

		it("should return enabled status from feature flags service",
			() =>
			{
				expect(service.enabled)
					.toBe(mockFeatureFlags.altchaEnabled());
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
