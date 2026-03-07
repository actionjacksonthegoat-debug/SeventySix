// <copyright file="email.fixture.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { E2E_CONFIG } from "./config.constant";

/**
 * Email captured by the mock Brevo API.
 */
export interface CapturedEmail
{
	/**
	 * Unique email ID.
	 */
	id: string;

	/**
	 * Email sender address.
	 */
	from: Array<{ address: string; name: string; }>;

	/**
	 * Email recipient addresses.
	 */
	to: Array<{ address: string; name: string; }>;

	/**
	 * Email subject line.
	 */
	subject: string;

	/**
	 * Plain text body.
	 */
	text: string;

	/**
	 * HTML body content.
	 */
	html: string;
}

/**
 * Mock Brevo API client for E2E email testing.
 * Provides methods to query captured emails.
 */
export class EmailTestHelper
{
	private static readonly EMAIL_CAPTURE_URL: string =
		E2E_CONFIG.emailCaptureUrl;

	/**
	 * Polls mock Brevo API until it responds or the timeout expires.
	 * Use in `beforeAll` to ensure the email capture server is ready before email tests run.
	 * @param timeoutMs
	 * Maximum time to wait in milliseconds.
	 * @throws
	 * Error if email capture server does not respond within the timeout.
	 */
	static async waitUntilReady(timeoutMs: number = 15000): Promise<void>
	{
		const pollingIntervalMs: number = 200;
		const startTime: number =
			Date.now();

		while (Date.now() - startTime < timeoutMs)
		{
			try
			{
				const response: Response =
					await fetch(`${this.EMAIL_CAPTURE_URL}/email`);

				if (response.ok)
				{
					return;
				}
			}
			catch
			{
				// Email capture server not ready yet — retry
			}

			await new Promise(
				(resolve) =>
					setTimeout(resolve, pollingIntervalMs));
		}

		throw new Error(
			`Email capture server did not become available within ${timeoutMs}ms at ${this.EMAIL_CAPTURE_URL}`);
	}

	/**
	 * Gets all captured emails.
	 * @returns
	 * Array of captured emails.
	 */
	static async getAllEmails(): Promise<CapturedEmail[]>
	{
		const response: Response =
			await fetch(`${this.EMAIL_CAPTURE_URL}/email`);

		return response.json();
	}

	/**
	 * Gets emails for a specific recipient.
	 * @param recipientEmail
	 * The email address to filter by.
	 * @returns
	 * Array of emails sent to the recipient.
	 */
	static async getEmailsForRecipient(recipientEmail: string): Promise<CapturedEmail[]>
	{
		const allEmails: CapturedEmail[] =
			await this.getAllEmails();

		return allEmails.filter(
			(email) =>
				email
					.to
					.some(
						(recipient) =>
							recipient.address === recipientEmail));
	}

	/**
	 * Waits for an email to arrive for a recipient.
	 * Polls every 200 ms and retries on transient network errors until timeout.
	 * @param recipientEmail
	 * The email address to wait for.
	 * @param options
	 * Optional configuration including `timeout` in milliseconds.
	 * @returns
	 * The first email found for the recipient.
	 * @throws
	 * Error if email not received within timeout.
	 */
	static async waitForEmail(
		recipientEmail: string,
		options: { timeout?: number; } = {}): Promise<CapturedEmail>
	{
		const timeoutMs: number =
			options.timeout ?? 10000;
		const startTime: number =
			Date.now();
		let lastKnownCount: number = 0;

		while (Date.now() - startTime < timeoutMs)
		{
			try
			{
				const allEmails: CapturedEmail[] =
					await this.getAllEmails();

				lastKnownCount =
					allEmails.length;

				const match: CapturedEmail | undefined =
					allEmails.find(
						(email) =>
							email
								.to
								.some(
									(recipient) =>
										recipient.address === recipientEmail));

				if (match !== undefined)
				{
					return match;
				}
			}
			catch
			{
				// Transient network error — retry within timeout
			}

			await new Promise(
				(resolve) => setTimeout(resolve, 200));
		}

		throw new Error(
			`Timeout waiting for email to ${recipientEmail} after ${timeoutMs}ms. `
				+ `Last known capture count: ${lastKnownCount}`);
	}

	/**
	 * Deletes all captured emails.
	 * Call in test setup for clean state.
	 */
	static async clearAllEmails(): Promise<void>
	{
		await fetch(
			`${this.EMAIL_CAPTURE_URL}/email/all`,
			{ method: "DELETE" });
	}

	/**
	 * Extracts a link from email HTML by pattern.
	 * @param email
	 * The email to extract from.
	 * @param linkPattern
	 * Regex pattern to match the link.
	 * @returns
	 * The extracted URL or null if not found.
	 */
	static extractLinkFromEmail(
		email: CapturedEmail,
		linkPattern: RegExp): string | null
	{
		const match: RegExpMatchArray | null =
			email.html.match(linkPattern);

		return match ? match[1] : null;
	}
}