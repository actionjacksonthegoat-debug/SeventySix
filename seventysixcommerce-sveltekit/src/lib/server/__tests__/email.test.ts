import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("$env/dynamic/private", () => ({
	env: { MOCK_SERVICES: "false", BREVO_API_KEY: "test_brevo_key" }
}));

describe("Brevo Email Service",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				vi.restoreAllMocks();
				vi.resetModules();
			});

		it("sends order confirmation with correct data",
			async () =>
			{
				const mockFetch =
					vi
						.fn()
						.mockResolvedValue(
							{ ok: true });
				vi.stubGlobal("fetch", mockFetch);

				const { sendOrderConfirmation } =
					await import("../integrations/brevo");
				await sendOrderConfirmation("buyer@test.com", "order-123", "59.98", 2);

				expect(mockFetch)
					.toHaveBeenCalledWith(
						"https://api.brevo.com/v3/smtp/email",
						expect.objectContaining(
							{
								method: "POST",
								headers: expect.objectContaining(
									{
										"api-key": "test_brevo_key"
									})
							}));

				const callBody =
					JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(callBody.to)
					.toEqual(
						[{ email: "buyer@test.com" }]);
				expect(callBody.templateId)
					.toBe(1);
				expect(callBody.params.orderNumber)
					.toBe("order-123");
				expect(callBody.params.total)
					.toBe("$59.98");
			});

		it("sends shipping notification with tracking info",
			async () =>
			{
				const mockFetch =
					vi
						.fn()
						.mockResolvedValue(
							{ ok: true });
				vi.stubGlobal("fetch", mockFetch);

				const { sendShippingNotification } =
					await import("../integrations/brevo");
				await sendShippingNotification(
					"buyer@test.com",
					"order-456",
					"TRACK123",
					"USPS");

				const callBody =
					JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(callBody.templateId)
					.toBe(2);
				expect(callBody.params.trackingNumber)
					.toBe("TRACK123");
				expect(callBody.params.carrier)
					.toBe("USPS");
			});

		it("handles Brevo API error gracefully",
			async () =>
			{
				const mockFetch =
					vi
						.fn()
						.mockResolvedValue(
							{ ok: false, status: 403 });
				vi.stubGlobal("fetch", mockFetch);
				const consoleSpy =
					vi
						.spyOn(console, "error")
						.mockImplementation(
							() =>
							{});

				const { sendOrderConfirmation } =
					await import("../integrations/brevo");

				// should not throw
				await sendOrderConfirmation("fail@test.com", "order-err", "10.00", 1);
				expect(consoleSpy)
					.toHaveBeenCalledWith(
						expect.stringContaining("[Brevo] Email send failed"));
			});

		it("does not send when API key is empty",
			async () =>
			{
				vi.doMock("$env/dynamic/private", () => ({
					env: { MOCK_SERVICES: "false", BREVO_API_KEY: "" }
				}));

				const mockFetch =
					vi.fn();
				vi.stubGlobal("fetch", mockFetch);
				const consoleSpy =
					vi
						.spyOn(console, "error")
						.mockImplementation(
							() =>
							{});

				const { sendOrderConfirmation } =
					await import("../integrations/brevo");
				await sendOrderConfirmation("nobody@test.com", "order-skip", "5.00", 1);

				expect(mockFetch).not.toHaveBeenCalled();
				expect(consoleSpy)
					.toHaveBeenCalledWith(
						expect.stringContaining("API key not configured"));
			});
	});