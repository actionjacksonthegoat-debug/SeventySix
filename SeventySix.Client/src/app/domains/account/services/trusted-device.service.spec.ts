import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ApiService } from "@shared/services/api.service";
import {
	createMockApiService,
	MockApiService
} from "@shared/testing";
import { of } from "rxjs";
import { TrustedDeviceService } from "./trusted-device.service";

describe("TrustedDeviceService",
	() =>
	{
		let service: TrustedDeviceService;
		let mockApiService: MockApiService;

		beforeEach(
			() =>
			{
				mockApiService =
					createMockApiService();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							TrustedDeviceService,
							{ provide: ApiService, useValue: mockApiService }
						]
					});

				service =
					TestBed.inject(TrustedDeviceService);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should call GET auth/trusted-devices on getDevices",
			() =>
			{
				const mockDevices: unknown[] =
					[
						{
							id: 1,
							deviceName: "Chrome on Windows",
							ipAddress: "127.0.0.1",
							lastUsed: "2024-01-15T10:00:00Z",
							createdAt: "2024-01-01T00:00:00Z"
						}
					];

				mockApiService.get.mockReturnValue(of(mockDevices));

				let result: unknown;

				service
					.getDevices()
					.subscribe((value) => (result = value));

				expect(mockApiService.get)
					.toHaveBeenCalledWith("auth/trusted-devices");
				expect(result)
					.toEqual(mockDevices);
			});

		it("should call DELETE auth/trusted-devices/:id on revokeDevice",
			() =>
			{
				mockApiService.delete.mockReturnValue(of(undefined));

				let completed: boolean = false;

				service
					.revokeDevice(42)
					.subscribe(
						{ complete: () => (completed = true) });

				expect(mockApiService.delete)
					.toHaveBeenCalledWith("auth/trusted-devices/42");
				expect(completed)
					.toBe(true);
			});

		it("should call DELETE auth/trusted-devices on revokeAllDevices",
			() =>
			{
				mockApiService.delete.mockReturnValue(of(undefined));

				let completed: boolean = false;

				service
					.revokeAllDevices()
					.subscribe(
						{ complete: () => (completed = true) });

				expect(mockApiService.delete)
					.toHaveBeenCalledWith("auth/trusted-devices");
				expect(completed)
					.toBe(true);
			});
	});