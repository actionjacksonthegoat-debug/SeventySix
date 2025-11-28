import { TokenStorageService } from "./token-storage.service";
import { setupSimpleServiceTest } from "@testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { LoggerService } from "./logger.service";

describe("TokenStorageService", () =>
{
	let service: TokenStorageService;
	let loggerSpy: jasmine.SpyObj<LoggerService>;

	beforeEach(() =>
	{
		loggerSpy = jasmine.createSpyObj("LoggerService", ["error"]);
		service = setupSimpleServiceTest(TokenStorageService, [
			provideHttpClient(),
			provideHttpClientTesting(),
			{ provide: LoggerService, useValue: loggerSpy }
		]);
		localStorage.clear();
	});

	afterEach(() =>
	{
		localStorage.clear();
	});

	describe("setAccessToken", () =>
	{
		it("should store access token in localStorage", () =>
		{
			const token = "test-access-token";

			service.setAccessToken(token);

			expect(localStorage.getItem("auth_access_token")).toBe(token);
		});

		it("should handle localStorage errors gracefully", () =>
		{
			spyOn(localStorage, "setItem").and.throwError("Storage error");

			service.setAccessToken("token");

			expect(loggerSpy.error).toHaveBeenCalled();
		});
	});

	describe("getAccessToken", () =>
	{
		it("should retrieve access token from localStorage", () =>
		{
			const token = "test-access-token";
			localStorage.setItem("auth_access_token", token);

			const result = service.getAccessToken();

			expect(result).toBe(token);
		});

		it("should return null if no token exists", () =>
		{
			const result = service.getAccessToken();

			expect(result).toBeNull();
		});

		it("should handle localStorage errors gracefully", () =>
		{
			spyOn(localStorage, "getItem").and.throwError("Storage error");

			const result = service.getAccessToken();

			expect(result).toBeNull();
			expect(loggerSpy.error).toHaveBeenCalled();
		});
	});

	describe("setRefreshToken", () =>
	{
		it("should store refresh token in localStorage", () =>
		{
			const token = "test-refresh-token";

			service.setRefreshToken(token);

			expect(localStorage.getItem("auth_refresh_token")).toBe(token);
		});

		it("should handle localStorage errors gracefully", () =>
		{
			spyOn(localStorage, "setItem").and.throwError("Storage error");

			service.setRefreshToken("token");

			expect(loggerSpy.error).toHaveBeenCalled();
		});
	});

	describe("getRefreshToken", () =>
	{
		it("should retrieve refresh token from localStorage", () =>
		{
			const token = "test-refresh-token";
			localStorage.setItem("auth_refresh_token", token);

			const result = service.getRefreshToken();

			expect(result).toBe(token);
		});

		it("should return null if no token exists", () =>
		{
			const result = service.getRefreshToken();

			expect(result).toBeNull();
		});
	});

	describe("clearTokens", () =>
	{
		it("should remove both access and refresh tokens", () =>
		{
			localStorage.setItem("auth_access_token", "access-token");
			localStorage.setItem("auth_refresh_token", "refresh-token");

			service.clearTokens();

			expect(localStorage.getItem("auth_access_token")).toBeNull();
			expect(localStorage.getItem("auth_refresh_token")).toBeNull();
		});

		it("should handle localStorage errors gracefully", () =>
		{
			spyOn(localStorage, "removeItem").and.throwError("Storage error");

			service.clearTokens();

			expect(loggerSpy.error).toHaveBeenCalled();
		});
	});

	describe("isAuthenticated", () =>
	{
		it("should return true when access token exists", () =>
		{
			service.setAccessToken("valid-token");

			const result = service.isAuthenticated();

			expect(result).toBe(true);
		});

		it("should return false when no access token exists", () =>
		{
			const result = service.isAuthenticated();

			expect(result).toBe(false);
		});

		it("should return false when access token is empty", () =>
		{
			service.setAccessToken("");

			const result = service.isAuthenticated();

			expect(result).toBe(false);
		});
	});
});
