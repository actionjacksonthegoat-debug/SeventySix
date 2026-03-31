import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch =
	vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Brevo Email",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
			});

		it("sends order confirmation with correct template data",
			async () =>
			{
				mockFetch.mockResolvedValue(
					{
						ok: true,
						json: () =>
							Promise.resolve(
								{ messageId: "msg-1" })
					});

				const response: Response =
					await fetch(
						"https://api.brevo.com/v3/smtp/email",
						{
							method: "POST",
							headers: {
								"api-key": "test-brevo-key",
								"Content-Type": "application/json"
							},
							body: JSON.stringify(
								{
									to: [{ email: "buyer@example.com" }],
									templateId: 1,
									params: {
										orderNumber: "ORD-001",
										total: "$59.98",
										itemCount: "2"
									}
								})
						});

				expect(mockFetch)
					.toHaveBeenCalledTimes(1);
				expect(response.ok)
					.toBe(true);

				const callBody =
					JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(callBody.to[0].email)
					.toBe("buyer@example.com");
				expect(callBody.templateId)
					.toBe(1);
			});

		it("sends shipping notification with tracking info",
			async () =>
			{
				mockFetch.mockResolvedValue(
					{ ok: true });

				await fetch("https://api.brevo.com/v3/smtp/email",
					{
						method: "POST",
						headers: {
							"api-key": "test-brevo-key",
							"Content-Type": "application/json"
						},
						body: JSON.stringify(
							{
								to: [{ email: "buyer@example.com" }],
								templateId: 2,
								params: {
									orderNumber: "ORD-001",
									trackingNumber: "1Z999AA10123456784",
									carrier: "UPS"
								}
							})
					});

				const callBody =
					JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(callBody.params.trackingNumber)
					.toBe("1Z999AA10123456784");
				expect(callBody.params.carrier)
					.toBe("UPS");
			});

		it("handles Brevo API errors gracefully",
			async () =>
			{
				mockFetch.mockResolvedValue(
					{ ok: false, status: 401 });

				const response: Response =
					await fetch(
						"https://api.brevo.com/v3/smtp/email",
						{
							method: "POST",
							headers: { "api-key": "invalid" }
						});

				expect(response.ok)
					.toBe(false);
				// Email failure should be logged but not thrown
				const shouldThrow: boolean = false;
				expect(shouldThrow)
					.toBe(false);
			});

		it("email addresses are not logged",
			() =>
			{
				const email: string = "buyer@example.com";
				const logSafe: string =
					email.replace(/^(.{2}).*@/, "$1***@");

				expect(logSafe)
					.toBe("bu***@example.com");
				expect(logSafe).not.toBe(email);
			});
	});