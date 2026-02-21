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
import { AuthResponse } from "@shared/models";
import { createTestQueryClient } from "@shared/testing";
import { provideTanStackQuery, QueryClient } from "@tanstack/angular-query-experimental";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockAuthResponse } from "./auth.service.test-helpers";
import { RegistrationFlowService } from "./registration-flow.service";

describe("RegistrationFlowService",
	() =>
	{
		let service: RegistrationFlowService;
		let httpMock: HttpTestingController;

		beforeEach(
			() =>
			{
				const queryClient: QueryClient =
					createTestQueryClient();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(withInterceptorsFromDi()),
							provideHttpClientTesting(),
							provideTanStackQuery(queryClient),
							RegistrationFlowService
						]
					});

				service =
					TestBed.inject(RegistrationFlowService);
				httpMock =
					TestBed.inject(HttpTestingController);
			});

		afterEach(
			() =>
			{
				httpMock.verify();
			});

		describe("initiateRegistration",
			() =>
			{
				it("should POST email to initiate endpoint",
					() =>
					{
						const email: string = "user@example.com";

						let completed: boolean = false;
						service
							.initiateRegistration(email)
							.subscribe(
								() =>
								{
									completed = true;
								});

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/register/initiate`);
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
						const altchaPayload: string = "altcha-challenge-payload";

						service
							.initiateRegistration(email, altchaPayload)
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/register/initiate`);
						expect(req.request.body)
							.toEqual(
								{
									email,
									altchaPayload
								});
						req.flush(null);
					});
			});

		describe("completeRegistration",
			() =>
			{
				it("should POST registration fields with credentials",
					() =>
					{
						const token: string = "verify-token-123";
						const username: string = "newuser";
						const password: string = "SecurePass123!";

						let response: AuthResponse | undefined;
						service
							.completeRegistration(token, username, password)
							.subscribe(
								(res: AuthResponse) =>
								{
									response = res;
								});

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/register/complete`);
						expect(req.request.method)
							.toBe("POST");
						expect(req.request.withCredentials)
							.toBe(true);
						expect(req.request.body)
							.toEqual(
								{
									token,
									username,
									password
								});

						const mockResponse: AuthResponse =
							createMockAuthResponse();
						req.flush(mockResponse);

						expect(response)
							.toEqual(mockResponse);
					});

				it("should propagate HTTP errors",
					() =>
					{
						let errorReceived: boolean = false;
						service
							.completeRegistration("bad-token", "user", "pass")
							.subscribe(
								{
									error: () =>
									{
										errorReceived = true;
									}
								});

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/register/complete`);
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
	});
