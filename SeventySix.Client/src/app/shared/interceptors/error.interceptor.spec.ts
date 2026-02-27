import {
	HttpErrorResponse,
	HttpRequest
} from "@angular/common/http";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import {
	NetworkError,
	NotFoundError,
	ValidationError
} from "@shared/models";
import { AuthService } from "@shared/services/auth.service";
import { LoggerService } from "@shared/services/logger.service";
import {
	createMockLogger,
	type MockLoggerService
} from "@shared/testing";
import { firstValueFrom } from "rxjs";
import { throwError } from "rxjs";
import { type Mock, vi } from "vitest";
import { errorInterceptor } from "./error.interceptor";

interface MockAuthService
{
	isAuthenticated: Mock;
	logout: Mock;
	markPasswordChangeRequired: Mock;
}

interface MockHttpHandler
{
	handle: Mock;
}

describe("errorInterceptor",
	() =>
	{
		let mockLogger: MockLoggerService;
		let mockAuthService: MockAuthService;
		let mockHandler: MockHttpHandler;
		let router: Router;

		beforeEach(
			() =>
			{
				mockLogger =
					createMockLogger();
				mockAuthService =
					{
						isAuthenticated: vi.fn(),
						logout: vi.fn(),
						markPasswordChangeRequired: vi.fn()
					};
				mockHandler =
					{
						handle: vi.fn()
					};

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(),
							provideHttpClientTesting(),
							provideRouter([]),
							{ provide: LoggerService, useValue: mockLogger },
							{ provide: AuthService, useValue: mockAuthService }
						]
					});

				router =
					TestBed.inject(Router);
				vi
					.spyOn(router, "navigate")
					.mockResolvedValue(true);
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		it("should convert network errors (status 0)",
			async () =>
			{
				const error: HttpErrorResponse =
					new HttpErrorResponse(
						{ status: 0 });
				mockHandler.handle.mockReturnValue(throwError(
					() => error));
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				await TestBed.runInInjectionContext(
					async () =>
					{
						try
						{
							await firstValueFrom(
								errorInterceptor(
									req,
									mockHandler.handle.bind(mockHandler)));
						}
						catch (receivedError)
						{
							expect(receivedError instanceof NetworkError)
								.toBe(true);
						}
					});
			});

		it("should convert 404 errors to NotFoundError",
			async () =>
			{
				const error: HttpErrorResponse =
					new HttpErrorResponse(
						{ status: 404 });
				mockHandler.handle.mockReturnValue(throwError(
					() => error));
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				await TestBed.runInInjectionContext(
					async () =>
					{
						try
						{
							await firstValueFrom(
								errorInterceptor(
									req,
									mockHandler.handle.bind(mockHandler)));
						}
						catch (receivedError)
						{
							expect(receivedError instanceof NotFoundError)
								.toBe(true);
						}
					});
			});

		it("should convert validation errors",
			async () =>
			{
				const error: HttpErrorResponse =
					new HttpErrorResponse(
						{
							status: 400,
							error: { errors: { field: ["error"] } }
						});
				mockHandler.handle.mockReturnValue(throwError(
					() => error));
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				await TestBed.runInInjectionContext(
					async () =>
					{
						try
						{
							await firstValueFrom(
								errorInterceptor(
									req,
									mockHandler.handle.bind(mockHandler)));
						}
						catch (receivedError)
						{
							expect(receivedError instanceof ValidationError)
								.toBe(true);
						}
					});
			});

		describe("403 Forbidden",
			() =>
			{
				it("should handle 403 PASSWORD_CHANGE_REQUIRED — mark required and navigate",
					async () =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 403,
									error: { error: "PASSWORD_CHANGE_REQUIRED" }
								});
						mockHandler.handle.mockReturnValue(throwError(
							() => error));
						const req: HttpRequest<unknown> =
							new HttpRequest("GET", "/api/data");

						await TestBed.runInInjectionContext(
							async () =>
							{
								// Returns EMPTY — firstValueFrom resolves with defaultValue
								const result: null =
									await firstValueFrom(
										errorInterceptor(
											req,
											mockHandler.handle.bind(mockHandler)),
										{ defaultValue: null });

								expect(result)
									.toBeNull();
								expect(mockAuthService.markPasswordChangeRequired)
									.toHaveBeenCalled();
								expect(router.navigate)
									.toHaveBeenCalledWith(
										["/auth/change-password"],
										expect.objectContaining(
											{
												queryParams: expect.objectContaining(
													{ required: "true" })
											}));
							});
					});

				it("should handle generic 403 — navigate to forbidden page",
					async () =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{ status: 403 });
						mockHandler.handle.mockReturnValue(throwError(
							() => error));
						const req: HttpRequest<unknown> =
							new HttpRequest("GET", "/api/data");

						await TestBed.runInInjectionContext(
							async () =>
							{
								const result: null =
									await firstValueFrom(
										errorInterceptor(
											req,
											mockHandler.handle.bind(mockHandler)),
										{ defaultValue: null });

								expect(result)
									.toBeNull();
								expect(router.navigate)
									.toHaveBeenCalledWith(
										["/error/403"]);
							});
					});
			});

		describe("401 Unauthorized",
			() =>
			{
				it("should pass through 401 on auth URLs without redirect",
					async () =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{ status: 401 });
						mockHandler.handle.mockReturnValue(throwError(
							() => error));
						const req: HttpRequest<unknown> =
							new HttpRequest("GET", "/api/auth/login");

						await TestBed.runInInjectionContext(
							async () =>
							{
								try
								{
									await firstValueFrom(
										errorInterceptor(
											req,
											mockHandler.handle.bind(mockHandler)));
								}
								catch
								{
									// Expected to throw — interceptor passes through on auth URLs
								}

								expect(router.navigate)
									.not
									.toHaveBeenCalled();
								expect(mockAuthService.logout)
									.not
									.toHaveBeenCalled();
							});
					});

				it("should logout and redirect on 401 when authenticated",
					async () =>
					{
						mockAuthService.isAuthenticated.mockReturnValue(true);
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{ status: 401 });
						mockHandler.handle.mockReturnValue(throwError(
							() => error));
						const req: HttpRequest<unknown> =
							new HttpRequest("GET", "/api/data");

						await TestBed.runInInjectionContext(
							async () =>
							{
								try
								{
									await firstValueFrom(
										errorInterceptor(
											req,
											mockHandler.handle.bind(mockHandler)));
								}
								catch
								{
									// Expected to throw
								}

								expect(mockAuthService.logout)
									.toHaveBeenCalled();
								expect(router.navigate)
									.toHaveBeenCalled();
							});
					});

				it("should redirect without logout on 401 when not authenticated",
					async () =>
					{
						mockAuthService.isAuthenticated.mockReturnValue(false);
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{ status: 401 });
						mockHandler.handle.mockReturnValue(throwError(
							() => error));
						const req: HttpRequest<unknown> =
							new HttpRequest("GET", "/api/data");

						await TestBed.runInInjectionContext(
							async () =>
							{
								try
								{
									await firstValueFrom(
										errorInterceptor(
											req,
											mockHandler.handle.bind(mockHandler)));
								}
								catch
								{
									// Expected to throw
								}

								expect(mockAuthService.logout)
									.not
									.toHaveBeenCalled();
								expect(router.navigate)
									.toHaveBeenCalled();
							});
					});
			});
	});