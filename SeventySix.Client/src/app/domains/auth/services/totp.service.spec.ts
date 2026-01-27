/**
 * TOTP Service unit tests.
 * Tests authenticator app enrollment operations.
 */

import {
	provideHttpClient,
	withInterceptorsFromDi
} from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
	TestRequest
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import {
	ConfirmTotpEnrollmentRequest,
	DisableTotpRequest,
	TotpSetupResponse
} from "@shared/models";
import { TotpService } from "./totp.service";

describe("TotpService",
	() =>
	{
		let service: TotpService;
		let httpTestingController: HttpTestingController;
		const baseUrl: string =
			`${environment.apiUrl}/auth`;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(withInterceptorsFromDi()),
							provideHttpClientTesting(),
							TotpService
						]
					});

				service =
					TestBed.inject(TotpService);
				httpTestingController =
					TestBed.inject(HttpTestingController);
			});

		afterEach(
			() =>
			{
				httpTestingController.verify();
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("initiateSetup",
			() =>
			{
				it("should call POST /totp/setup and return setup response",
					() =>
					{
						// Arrange
						const expectedResponse: TotpSetupResponse =
							{
								secret: "JBSWY3DPEHPK3PXP",
								qrCodeUri: "otpauth://totp/SeventySix:test@example.com?secret=JBSWY3DPEHPK3PXP"
							};

						// Act & Assert
						service
							.initiateSetup()
							.subscribe(
								(response: TotpSetupResponse) =>
								{
									expect(response.secret)
										.toBe(expectedResponse.secret);
									expect(response.qrCodeUri)
										.toBe(expectedResponse.qrCodeUri);
								});

						const request: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/totp/setup`);
						expect(request.request.method)
							.toBe("POST");
						expect(request.request.withCredentials)
							.toBe(true);
						request.flush(expectedResponse);
					});
			});

		describe("confirmSetup",
			() =>
			{
				it("should call POST /totp/confirm with verification code",
					() =>
					{
						// Arrange
						const confirmRequest: ConfirmTotpEnrollmentRequest =
							{
								code: "123456"
							};

						// Act & Assert
						service
							.confirmSetup(confirmRequest)
							.subscribe(
								() =>
								{
									// Success - no response body expected
								});

						const request: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/totp/confirm`);
						expect(request.request.method)
							.toBe("POST");
						expect(request.request.body)
							.toEqual(confirmRequest);
						expect(request.request.withCredentials)
							.toBe(true);
						request.flush(null);
					});
			});

		describe("disable",
			() =>
			{
				it("should call POST /totp/disable with password",
					() =>
					{
						// Arrange
						const disableRequest: DisableTotpRequest =
							{
								password: "userPassword123!"
							};

						// Act & Assert
						service
							.disable(disableRequest)
							.subscribe(
								() =>
								{
									// Success - no response body expected
								});

						const request: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/totp/disable`);
						expect(request.request.method)
							.toBe("POST");
						expect(request.request.body)
							.toEqual(disableRequest);
						expect(request.request.withCredentials)
							.toBe(true);
						request.flush(null);
					});
			});
	});
