/**
 * Backup Codes Service unit tests.
 * Tests emergency MFA recovery code operations.
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
import { BackupCodesService } from "./backup-codes.service";

describe("BackupCodesService",
	() =>
	{
		let service: BackupCodesService;
		let httpTestingController: HttpTestingController;
		const baseUrl: string =
			`${environment.apiUrl}/auth/mfa`;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(withInterceptorsFromDi()),
							provideHttpClientTesting(),
							BackupCodesService
						]
					});

				service =
					TestBed.inject(BackupCodesService);
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

		describe("generate",
			() =>
			{
				it("should call POST /backup-codes and return generated codes",
					() =>
					{
						// Arrange
						const expectedCodes: string[] =
							[
								"ABCD1234",
								"EFGH5678",
								"IJKL9012",
								"MNOP3456",
								"QRST7890",
								"UVWX1234",
								"YZAB5678",
								"CDEF9012",
								"GHIJ3456",
								"KLMN7890"
							];

						// Act & Assert
						service
							.generate()
							.subscribe(
								(codes: string[]) =>
								{
									expect(codes)
										.toHaveLength(10);
									expect(codes[0])
										.toBe("ABCD1234");
								});

						const request: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/backup-codes`);
						expect(request.request.method)
							.toBe("POST");
						expect(request.request.withCredentials)
							.toBe(true);
						request.flush(expectedCodes);
					});
			});

		describe("getRemainingCount",
			() =>
			{
				it("should call GET /backup-codes/remaining and return count",
					() =>
					{
						// Arrange
						const expectedCount: number = 7;

						// Act & Assert
						service
							.getRemainingCount()
							.subscribe(
								(count: number) =>
								{
									expect(count)
										.toBe(7);
								});

						const request: TestRequest =
							httpTestingController.expectOne(`${baseUrl}/backup-codes/remaining`);
						expect(request.request.method)
							.toBe("GET");
						expect(request.request.withCredentials)
							.toBe(true);
						request.flush(expectedCount);
					});
			});
	});
