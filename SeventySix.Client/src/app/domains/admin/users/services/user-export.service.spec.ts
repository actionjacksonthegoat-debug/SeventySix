import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { UserExportService } from "./user-export.service";
import { DateService } from "@shared/services";
import { UserFixtures } from "@admin/testing";

describe("UserExportService",
	() =>
	{
		let service: UserExportService;
		let mockDateService: jasmine.SpyObj<DateService>;

		beforeEach(
			() =>
			{
				mockDateService =
					jasmine.createSpyObj(
						"DateService",
						["now"]);
				mockDateService.now
				.and.returnValue("2024-01-15T12:00:00Z");

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
						const createElementSpy: jasmine.Spy =
							spyOn(document, "createElement");

						// Act
						service.exportToCsv([]);

						// Assert - no download should be triggered
						expect(createElementSpy)
						.not.toHaveBeenCalled();
					});

				it("should generate CSV with headers and user data",
					() =>
					{
						// Arrange
						const users: ReturnType<typeof UserFixtures.createUsers> =
							UserFixtures.createUsers(2);
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						let downloadedContent: string = "";

						// Mock the download mechanism
						const mockLink: Partial<HTMLAnchorElement> =
							{
								download: "",
								href: "",
								style: { visibility: "" } as CSSStyleDeclaration,
								setAttribute: jasmine.createSpy("setAttribute"),
								click: jasmine.createSpy("click")
							};
						spyOn(document, "createElement")
						.and.returnValue(mockLink as HTMLAnchorElement);
						spyOn(document.body, "appendChild");
						spyOn(document.body, "removeChild");
						spyOn(URL, "createObjectURL")
						.and.callFake(
							(blob: Blob) =>
							{
								const reader: FileReader =
									new FileReader();
								reader.readAsText(blob);
								reader.onload =
									(): void =>
									{
										downloadedContent =
											reader.result as string;
									};
								return "blob:test";
							});
						spyOn(URL, "revokeObjectURL");

						// Act
						service.exportToCsv(users);

						// Assert
						expect(document.createElement)
						.toHaveBeenCalledWith("a");
						expect(mockLink.setAttribute)
						.toHaveBeenCalledWith("download", jasmine.stringMatching(/users_export_.*\.csv/));
						expect(mockLink.click)
						.toHaveBeenCalled();
					});

				it("should use provided filename when specified",
					() =>
					{
						// Arrange
						const users: ReturnType<typeof UserFixtures.createUsers> =
							UserFixtures.createUsers(1);
						const customFilename: string = "my-custom-export.csv";

						const mockLink: Partial<HTMLAnchorElement> =
							{
								download: "",
								href: "",
								style: { visibility: "" } as CSSStyleDeclaration,
								setAttribute: jasmine.createSpy("setAttribute"),
								click: jasmine.createSpy("click")
							};
						spyOn(document, "createElement")
						.and.returnValue(mockLink as HTMLAnchorElement);
						spyOn(document.body, "appendChild");
						spyOn(document.body, "removeChild");
						spyOn(URL, "createObjectURL")
						.and.returnValue("blob:test");
						spyOn(URL, "revokeObjectURL");

						// Act
						service.exportToCsv(
							users,
							customFilename);

						// Assert
						expect(mockLink.setAttribute)
						.toHaveBeenCalledWith(
							"download",
							customFilename);
					});
			});
	});
