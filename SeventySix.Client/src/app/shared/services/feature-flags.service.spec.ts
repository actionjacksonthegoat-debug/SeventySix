import { HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { FeatureFlags } from "@shared/models/feature-flags.model";
import { withHttpTesting } from "@testing/provider-helpers";
import { setupSimpleServiceTest } from "@testing/test-bed-builders";
import { FeatureFlagsService } from "./feature-flags.service";

/** Mirrors the module-private DEFAULT_FLAGS constant. */
const EXPECTED_DEFAULTS: FeatureFlags =
	{
		mfaEnabled: true,
		totpEnabled: false,
		oAuthEnabled: false,
		oAuthProviders: [],
		altchaEnabled: true,
		tokenRefreshBufferSeconds: 60
	};

const FEATURE_FLAGS_URL: string = "/api/v1/config/features";

describe("FeatureFlagsService",
	() =>
	{
		let service: FeatureFlagsService;
		let httpMock: HttpTestingController;

		beforeEach(
			() =>
			{
				service =
					setupSimpleServiceTest(
						FeatureFlagsService,
						[...withHttpTesting()]);
				httpMock =
					TestBed.inject(HttpTestingController);
			});

		afterEach(
			() =>
			{
				httpMock.verify();
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("default signal values",
			() =>
			{
				it("should default mfaEnabled to true",
					() =>
					{
						expect(service.mfaEnabled())
							.toBe(true);
					});

				it("should default totpEnabled to false",
					() =>
					{
						expect(service.totpEnabled())
							.toBe(false);
					});

				it("should default oAuthEnabled to false",
					() =>
					{
						expect(service.oAuthEnabled())
							.toBe(false);
					});

				it("should default oAuthProviders to empty array",
					() =>
					{
						expect(service.oAuthProviders())
							.toEqual([]);
					});

				it("should default altchaEnabled to true",
					() =>
					{
						expect(service.altchaEnabled())
							.toBe(true);
					});

				it("should default tokenRefreshBufferSeconds to 60",
					() =>
					{
						expect(service.tokenRefreshBufferSeconds())
							.toBe(EXPECTED_DEFAULTS.tokenRefreshBufferSeconds);
					});
			});

		describe("initialize()",
			() =>
			{
				it("should update signals with API response on success",
					async () =>
					{
						const serverFlags: FeatureFlags =
							{
								mfaEnabled: false,
								totpEnabled: true,
								oAuthEnabled: true,
								oAuthProviders: ["github"],
								altchaEnabled: false,
								tokenRefreshBufferSeconds: 30
							};

						const initPromise: Promise<void> =
							service.initialize();

						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(
								(request) =>
									request.url.endsWith(FEATURE_FLAGS_URL));
						req.flush(serverFlags);

						await initPromise;

						expect(service.mfaEnabled())
							.toBe(false);
						expect(service.totpEnabled())
							.toBe(true);
						expect(service.oAuthEnabled())
							.toBe(true);
						expect(service.oAuthProviders())
							.toEqual(
								["github"]);
						expect(service.altchaEnabled())
							.toBe(false);
						expect(service.tokenRefreshBufferSeconds())
							.toBe(30);
					});

				it("should fall back to defaults when the API request fails",
					async () =>
					{
						// Override signals to non-default values first to verify reset
						const initPromise: Promise<void> =
							service.initialize();

						const req: ReturnType<typeof httpMock.expectOne> =
							httpMock.expectOne(
								(request) =>
									request.url.endsWith(FEATURE_FLAGS_URL));
						req.flush("Server error",
							{ status: 500, statusText: "Internal Server Error" });

						await initPromise;

						// Should remain at safe defaults after error
						expect(service.mfaEnabled())
							.toBe(EXPECTED_DEFAULTS.mfaEnabled);
						expect(service.totpEnabled())
							.toBe(EXPECTED_DEFAULTS.totpEnabled);
						expect(service.oAuthEnabled())
							.toBe(EXPECTED_DEFAULTS.oAuthEnabled);
						expect(service.oAuthProviders())
							.toEqual(EXPECTED_DEFAULTS.oAuthProviders);
						expect(service.altchaEnabled())
							.toBe(EXPECTED_DEFAULTS.altchaEnabled);
						expect(service.tokenRefreshBufferSeconds())
							.toBe(EXPECTED_DEFAULTS.tokenRefreshBufferSeconds);
					});
			});
	});