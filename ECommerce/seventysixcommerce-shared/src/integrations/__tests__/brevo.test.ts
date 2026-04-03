import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	BREVO_TEMPLATES,
	type BrevoClient,
	createBrevoClient
} from "../brevo";

const mockFetch: ReturnType<typeof vi.fn> =
	vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("createBrevoClient",
	() =>
	{
		let client: BrevoClient;

		beforeEach(
			() =>
			{
				vi.clearAllMocks();
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		describe("mock mode",
			() =>
			{
				beforeEach(
					() =>
					{
						client =
							createBrevoClient(
								{
									apiKey: "test-key",
									mockServices: true
								});
					});

				it("logs warning instead of sending in mock mode",
					async () =>
					{
						const warnSpy: ReturnType<typeof vi.spyOn> =
							vi
								.spyOn(console, "warn")
								.mockImplementation(() => undefined);

						await client.sendTransactionalEmail(
							"buyer@example.com",
							1,
							{ orderNumber: "ORD-001" });

						expect(mockFetch).not.toHaveBeenCalled();
						expect(warnSpy)
							.toHaveBeenCalledWith(
								expect.stringContaining("[Brevo Mock]"),
								expect.objectContaining(
									{ orderNumber: "ORD-001" }));
					});

				it("masks email address in mock log",
					async () =>
					{
						const warnSpy: ReturnType<typeof vi.spyOn> =
							vi
								.spyOn(console, "warn")
								.mockImplementation(() => undefined);

						await client.sendTransactionalEmail(
							"buyer@example.com",
							1,
							{});

						expect(warnSpy)
							.toHaveBeenCalledWith(
								expect.stringContaining("bu***@example.com"),
								expect.any(Object));
					});
			});

		describe("live mode",
			() =>
			{
				beforeEach(
					() =>
					{
						client =
							createBrevoClient(
								{
									apiKey: "test-brevo-key",
									mockServices: false
								});
					});

				it("sends email to Brevo API with correct headers",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{ ok: true });

						await client.sendTransactionalEmail(
							"buyer@example.com",
							1,
							{ orderNumber: "ORD-001" });

						expect(mockFetch)
							.toHaveBeenCalledWith(
								"https://api.brevo.com/v3/smtp/email",
								expect.objectContaining(
									{
										method: "POST",
										headers: expect.objectContaining(
											{
												"api-key": "test-brevo-key",
												"Content-Type": "application/json"
											})
									}));
					});

				it("sends correct body structure",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{ ok: true });

						await client.sendTransactionalEmail(
							"buyer@example.com",
							1,
							{ orderNumber: "ORD-001" });

						const callBody: Record<string, unknown> =
							JSON.parse(
								mockFetch.mock.calls[0][1].body as string);
						expect(callBody.to)
							.toEqual(
								[{ email: "buyer@example.com" }]);
						expect(callBody.templateId)
							.toBe(1);
						expect(callBody.params)
							.toEqual(
								{ orderNumber: "ORD-001" });
					});

				it("handles API errors gracefully without throwing",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{ ok: false, status: 401 });
						const errorSpy: ReturnType<typeof vi.spyOn> =
							vi
								.spyOn(console, "error")
								.mockImplementation(() => undefined);

						await client.sendTransactionalEmail(
							"buyer@example.com",
							1,
							{});

						expect(errorSpy)
							.toHaveBeenCalledWith(
								expect.stringContaining("[Brevo] Email send failed (401)"));
					});

				it("handles network errors gracefully without throwing",
					async () =>
					{
						mockFetch.mockRejectedValue(
							new Error("Network failure"));
						const errorSpy: ReturnType<typeof vi.spyOn> =
							vi
								.spyOn(console, "error")
								.mockImplementation(() => undefined);

						await client.sendTransactionalEmail(
							"buyer@example.com",
							1,
							{});

						expect(errorSpy)
							.toHaveBeenCalledWith(
								expect.stringContaining("[Brevo] Email error"),
								"Network failure");
					});

				it("masks email in error logs",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{ ok: false, status: 500 });
						const errorSpy: ReturnType<typeof vi.spyOn> =
							vi
								.spyOn(console, "error")
								.mockImplementation(() => undefined);

						await client.sendTransactionalEmail(
							"buyer@example.com",
							1,
							{});

						expect(errorSpy)
							.toHaveBeenCalledWith(
								expect.stringContaining("bu***@example.com"));
					});
			});

		describe("empty API key",
			() =>
			{
				it("logs error and skips when API key is empty",
					async () =>
					{
						client =
							createBrevoClient(
								{
									apiKey: "",
									mockServices: false
								});
						const errorSpy: ReturnType<typeof vi.spyOn> =
							vi
								.spyOn(console, "error")
								.mockImplementation(() => undefined);

						await client.sendTransactionalEmail(
							"buyer@example.com",
							1,
							{});

						expect(mockFetch).not.toHaveBeenCalled();
						expect(errorSpy)
							.toHaveBeenCalledWith(
								expect.stringContaining("API key not configured"));
					});
			});

		describe("convenience methods",
			() =>
			{
				beforeEach(
					() =>
					{
						client =
							createBrevoClient(
								{
									apiKey: "test-key",
									mockServices: false
								});
						mockFetch.mockResolvedValue(
							{ ok: true });
					});

				it("sendOrderConfirmation uses correct template and params",
					async () =>
					{
						await client.sendOrderConfirmation(
							"buyer@example.com",
							"ORD-001",
							"59.98",
							2);

						const callBody: Record<string, unknown> =
							JSON.parse(
								mockFetch.mock.calls[0][1].body as string);
						expect(callBody.templateId)
							.toBe(BREVO_TEMPLATES.ORDER_CONFIRMATION);
						expect(callBody.params)
							.toEqual(
								{
									orderNumber: "ORD-001",
									total: "$59.98",
									itemCount: "2"
								});
					});

				it("sendShippingNotification uses correct template and params",
					async () =>
					{
						await client.sendShippingNotification(
							"buyer@example.com",
							"ORD-001",
							"1Z999AA10123456784",
							"UPS");

						const callBody: Record<string, unknown> =
							JSON.parse(
								mockFetch.mock.calls[0][1].body as string);
						expect(callBody.templateId)
							.toBe(BREVO_TEMPLATES.SHIPPING_NOTIFICATION);
						expect(callBody.params)
							.toEqual(
								{
									orderNumber: "ORD-001",
									trackingNumber: "1Z999AA10123456784",
									carrier: "UPS"
								});
					});
			});

		describe("BREVO_TEMPLATES",
			() =>
			{
				it("has expected template IDs",
					() =>
					{
						expect(BREVO_TEMPLATES.ORDER_CONFIRMATION)
							.toBe(1);
						expect(BREVO_TEMPLATES.SHIPPING_NOTIFICATION)
							.toBe(2);
					});
			});
	});