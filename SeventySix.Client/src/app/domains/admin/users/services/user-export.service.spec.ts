import { UserFixtures } from "@admin/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { DateService } from "@shared/services";
import { vi } from "vitest";
import { UserExportService } from "./user-export.service";

describe("UserExportService",
	() =>
	{
		let service: UserExportService;

		interface MockDateService {
			now: ReturnType<typeof vi.fn>;
		}

		let mockDateService: MockDateService;

		beforeEach(
			() =>
			{
				mockDateService =
					{ now: vi.fn() };
				mockDateService
					.now
					.mockReturnValue("2024-01-15T12:00:00Z");

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							UserExportService,
							{ provide: DateService, useValue: mockDateService }
						]
					});

				service =
					TestBed.inject(UserExportService);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("exportToCsv",
			() =>
			{
				it("should return early when users array is empty",
					() =>
					{
						// Arrange
						const createElementSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(document, "createElement");

						// Act
						service.exportToCsv([]);

						// Assert - no download should be triggered
						expect(createElementSpy)
							.not
							.toHaveBeenCalled();
					});

				it("should generate CSV with headers and user data",
					() =>
					{
						// Arrange
						const users: ReturnType<typeof UserFixtures.createUsers> =
							UserFixtures.createUsers(2);

						// Create a real anchor element for appendChild to work
						const mockLink: HTMLAnchorElement =
							document.createElement("a");
						const setAttributeSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(mockLink, "setAttribute");
						const clickSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(mockLink, "click")
								.mockImplementation(
									() =>
									{});

						vi.spyOn(document, "createElement")
							.mockReturnValue(mockLink);
						vi.spyOn(document.body, "appendChild")
							.mockImplementation(
								(node: Node) => node);
						vi.spyOn(document.body, "removeChild")
							.mockImplementation(
								(node: Node) => node);
						vi.spyOn(URL, "createObjectURL")
							.mockReturnValue("blob:test");
						vi.spyOn(URL, "revokeObjectURL")
							.mockImplementation(
								() =>
								{});

						// Act
						service.exportToCsv(users);

						// Assert
						expect(document.createElement)
							.toHaveBeenCalledWith("a");
						expect(setAttributeSpy)
							.toHaveBeenCalledWith("download", expect.stringMatching(/users_export_.*\.csv/));
						expect(clickSpy)
							.toHaveBeenCalled();
					});

				it("should use provided filename when specified",
					() =>
					{
						// Arrange
						const users: ReturnType<typeof UserFixtures.createUsers> =
							UserFixtures.createUsers(1);
						const customFilename: string = "my-custom-export.csv";

						// Create a real anchor element for appendChild to work
						const mockLink: HTMLAnchorElement =
							document.createElement("a");
						const setAttributeSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(mockLink, "setAttribute");
						vi.spyOn(mockLink, "click")
							.mockImplementation(
								() =>
								{});

						vi.spyOn(document, "createElement")
							.mockReturnValue(mockLink);
						vi.spyOn(document.body, "appendChild")
							.mockImplementation(
								(node: Node) => node);
						vi.spyOn(document.body, "removeChild")
							.mockImplementation(
								(node: Node) => node);
						vi.spyOn(URL, "createObjectURL")
							.mockReturnValue("blob:test");
						vi.spyOn(URL, "revokeObjectURL")
							.mockImplementation(
								() =>
								{});

						// Act
						service.exportToCsv(
							users,
							customFilename);

						// Assert
						expect(setAttributeSpy)
							.toHaveBeenCalledWith(
								"download",
								customFilename);
					});
			});
	});
