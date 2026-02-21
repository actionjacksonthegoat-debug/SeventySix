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
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PasswordResetService } from "./password-reset.service";

describe("PasswordResetService",
	() =>
	{
		let service: PasswordResetService;
		let httpMock: HttpTestingController;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(withInterceptorsFromDi()),
							provideHttpClientTesting(),
							PasswordResetService
						]
					});

				service =
					TestBed.inject(PasswordResetService);
				httpMock =
					TestBed.inject(HttpTestingController);
			});

		afterEach(
			() =>
			{
				httpMock.verify();
			});

		describe("setPassword",
			() =>
			{
				it("should POST token and newPassword to set-password endpoint",
					() =>
					{
						const token: string = "reset-token-123";
						const newPassword: string = "NewPass123!";

						let completed: boolean = false;
						service
							.setPassword(token, newPassword)
							.subscribe(
								() =>
								{
									completed = true;
								});

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/password/set`);
						expect(req.request.method)
							.toBe("POST");
						expect(req.request.body)
							.toEqual(
								{
									token,
									newPassword
								});
						req.flush(null);

						expect(completed)
							.toBe(true);
					});

				it("should propagate HTTP errors",
					() =>
					{
						let errorReceived: boolean = false;
						service
							.setPassword("bad-token", "pass")
							.subscribe(
								{
									error: () =>
									{
										errorReceived = true;
									}
								});

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/password/set`);
						req.flush(
							{ error: "Invalid token" },
							{
								status: 400,
								statusText: "Bad Request"
							});

						expect(errorReceived)
							.toBe(true);
					});
			});

		describe("requestPasswordReset",
			() =>
			{
				it("should POST email to forgot-password endpoint",
					() =>
					{
						const email: string = "user@example.com";

						let completed: boolean = false;
						service
							.requestPasswordReset(email)
							.subscribe(
								() =>
								{
									completed = true;
								});

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/password/forgot`);
						expect(req.request.method)
							.toBe("POST");
						expect(req.request.body)
							.toEqual(
								{
									email,
									altchaPayload: null
								});
						req.flush(null);

						expect(completed)
							.toBe(true);
					});

				it("should include altchaPayload when provided",
					() =>
					{
						const email: string = "user@example.com";
						const altchaPayload: string = "altcha-token";

						service
							.requestPasswordReset(email, altchaPayload)
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/password/forgot`);
						expect(req.request.body)
							.toEqual(
								{
									email,
									altchaPayload
								});
						req.flush(null);
					});
			});
	});