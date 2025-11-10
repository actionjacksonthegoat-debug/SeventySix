import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { authGuard } from "./auth.guard";
import { LoggerService } from "../services/logger.service";
import { TokenStorageService } from "../services/token-storage.service";
import { NotificationService } from "../services/notification.service";

describe("authGuard", () =>
{
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockTokenStorage: jasmine.SpyObj<TokenStorageService>;
	let mockNotification: jasmine.SpyObj<NotificationService>;

	beforeEach(() =>
	{
		mockLogger = jasmine.createSpyObj("LoggerService", ["warning"]);
		mockTokenStorage = jasmine.createSpyObj("TokenStorageService", [
			"isAuthenticated"
		]);
		mockNotification = jasmine.createSpyObj("NotificationService", [
			"error"
		]);

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				{ provide: LoggerService, useValue: mockLogger },
				{ provide: TokenStorageService, useValue: mockTokenStorage },
				{ provide: NotificationService, useValue: mockNotification }
			]
		});
	});

	it("should allow access when authenticated", () =>
	{
		mockTokenStorage.isAuthenticated.and.returnValue(true);

		const result = TestBed.runInInjectionContext(() =>
			authGuard({} as any, { url: "/protected" } as any)
		);

		expect(result).toBe(true);
	});

	it("should deny access when not authenticated", () =>
	{
		mockTokenStorage.isAuthenticated.and.returnValue(false);

		const result = TestBed.runInInjectionContext(() =>
			authGuard({} as any, { url: "/protected" } as any)
		);

		expect(result).toBe(false);
		expect(mockNotification.error).toHaveBeenCalled();
		expect(mockLogger.warning).toHaveBeenCalled();
	});
});
