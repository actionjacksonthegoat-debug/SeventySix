/**
 * MFA Service unit tests.
 * Tests multi-factor authentication HTTP calls and state management.
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
import { STORAGE_KEYS } from "@shared/constants";
import {
	AuthResponse,
	MfaState,
	ResendMfaCodeRequest,
	VerifyBackupCodeRequest,
	VerifyMfaRequest,
	VerifyTotpRequest
} from "@shared/models";
import { StorageService } from "@shared/services";
import { vi } from "vitest";
import { MfaService } from "./mfa.service";

describe("MfaService",
	() =>
	{
		let service: MfaService;
		let httpTestingController: HttpTestingController;
		let storageService: StorageService;
		const baseUrl: string =
			`${environment.apiUrl}/auth`;

		const mockAuthResponse: AuthResponse =
			{
				accessToken: "mock-access-token",
				expiresAt: "2025-01-01T00:00:00Z",
				email: "user@example.com",
				fullName: "Test User",
				requiresMfa: false,
				requiresPasswordChange: false
			};

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(withInterceptorsFromDi()),
							provideHttpClientTesting(),
							MfaService
						]
					});

				service =
					TestBed.inject(MfaService);
				httpTestingController =
					TestBed.inject(HttpTestingController);
				storageService =
					TestBed.inject(StorageService);
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

		describe("verifyMfa",
			() =>
			{
				it("should call POST /mfa/verify with withCredentials",
					() =>
					{
						const request: VerifyMfaRequest =
							{
								challengeToken: "test-token",
								code: "123456",
								trustDevice: false
							};

						service
							.verifyMfa(request)
							.subscribe(
								(response: AuthResponse) =>
								{
									expect(response.accessToken)
										.toBe(mockAuthResponse.accessToken);
								});

						const httpRequest: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/mfa/verify`);
						expect(httpRequest.request.method)
							.toBe("POST");
						expect(httpRequest.request.body)
							.toEqual(request);
						expect(httpRequest.request.withCredentials)
							.toBe(true);
						httpRequest.flush(mockAuthResponse);
					});

				it("should clear MFA state after successful verify",
					() =>
					{
						const mfaState: MfaState =
							{
								challengeToken: "test-token",
								email: "user@example.com",
								returnUrl: "/"
							};
						service.setMfaState(mfaState);

						const request: VerifyMfaRequest =
							{
								challengeToken: "test-token",
								code: "123456",
								trustDevice: false
							};

						service
							.verifyMfa(request)
							.subscribe();

						const httpRequest: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/mfa/verify`);
						httpRequest.flush(mockAuthResponse);

						expect(service.getMfaState())
							.toBeNull();
					});
			});

		describe("verifyTotp",
			() =>
			{
				it("should call POST /mfa/verify-totp with withCredentials",
					() =>
					{
						const request: VerifyTotpRequest =
							{
								challengeToken: "test-token",
								code: "654321",
								trustDevice: false
							};

						service
							.verifyTotp(request)
							.subscribe(
								(response: AuthResponse) =>
								{
									expect(response.accessToken)
										.toBe(mockAuthResponse.accessToken);
								});

						const httpRequest: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/mfa/verify-totp`);
						expect(httpRequest.request.method)
							.toBe("POST");
						expect(httpRequest.request.body)
							.toEqual(request);
						expect(httpRequest.request.withCredentials)
							.toBe(true);
						httpRequest.flush(mockAuthResponse);
					});

				it("should clear MFA state after successful TOTP verify",
					() =>
					{
						const mfaState: MfaState =
							{
								challengeToken: "test-token",
								email: "user@example.com",
								returnUrl: "/"
							};
						service.setMfaState(mfaState);

						service
							.verifyTotp(
								{
									challengeToken: "test-token",
									code: "654321",
									trustDevice: false
								})
							.subscribe();

						const httpRequest: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/mfa/verify-totp`);
						httpRequest.flush(mockAuthResponse);

						expect(service.getMfaState())
							.toBeNull();
					});
			});

		describe("verifyBackupCode",
			() =>
			{
				it("should call POST /mfa/verify-backup with withCredentials",
					() =>
					{
						const request: VerifyBackupCodeRequest =
							{
								challengeToken: "test-token",
								code: "ABCD1234",
								trustDevice: false
							};

						service
							.verifyBackupCode(request)
							.subscribe(
								(response: AuthResponse) =>
								{
									expect(response.accessToken)
										.toBe(mockAuthResponse.accessToken);
								});

						const httpRequest: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/mfa/verify-backup`);
						expect(httpRequest.request.method)
							.toBe("POST");
						expect(httpRequest.request.body)
							.toEqual(request);
						expect(httpRequest.request.withCredentials)
							.toBe(true);
						httpRequest.flush(mockAuthResponse);
					});
			});

		describe("resendMfaCode",
			() =>
			{
				it("should call POST /mfa/resend with withCredentials",
					() =>
					{
						const request: ResendMfaCodeRequest =
							{
								challengeToken: "test-token"
							};

						service
							.resendMfaCode(request)
							.subscribe();

						const httpRequest: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/mfa/resend`);
						expect(httpRequest.request.method)
							.toBe("POST");
						expect(httpRequest.request.body)
							.toEqual(request);
						expect(httpRequest.request.withCredentials)
							.toBe(true);
						httpRequest.flush(null);
					});
			});

		describe("MFA state management",
			() =>
			{
				it("should store MFA state via storage service",
					() =>
					{
						const setSessionSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(storageService, "setSessionItem");

						const mfaState: MfaState =
							{
								challengeToken: "test-token",
								email: "user@example.com",
								returnUrl: "/dashboard"
							};

						service.setMfaState(mfaState);

						expect(setSessionSpy)
							.toHaveBeenCalledWith(
								STORAGE_KEYS.AUTH_MFA_STATE,
								mfaState);
					});

				it("should return null when no MFA state exists",
					() =>
					{
						vi
							.spyOn(storageService, "getSessionItem")
							.mockReturnValue(null);

						expect(service.getMfaState())
							.toBeNull();
					});

				it("should clear MFA state via storage service",
					() =>
					{
						const removeSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(storageService, "removeSessionItem");

						service.clearMfaState();

						expect(removeSpy)
							.toHaveBeenCalledWith(
								STORAGE_KEYS.AUTH_MFA_STATE);
					});

				it("should retrieve stored MFA state from session storage",
					() =>
					{
						const mfaState: MfaState =
							{
								challengeToken: "test-token",
								email: "user@example.com",
								returnUrl: "/"
							};

						vi
							.spyOn(storageService, "getSessionItem")
							.mockReturnValue(mfaState);

						const retrieved: MfaState | null =
							service.getMfaState();

						expect(retrieved)
							.toEqual(mfaState);
					});
			});
	});
