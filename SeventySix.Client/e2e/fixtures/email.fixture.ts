// <copyright file="email.fixture.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Email from MailDev API.
 */
export interface MailDevEmail
{
	/**
	 * Unique email ID.
	 */
	id: string;

	/**
	 * Email sender address.
	 */
	from: Array<{ address: string; name: string }>;

	/**
	 * Email recipient addresses.
	 */
	to: Array<{ address: string; name: string }>;

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
 * MailDev API client for E2E email testing.
 * Provides methods to query captured emails.
 */
export class EmailTestHelper
{
	private static readonly MAILDEV_API_URL: string = "http://localhost:1080";

	/**
	 * Polls MailDev until it responds or the timeout expires.
	 * Use in `beforeAll` to ensure MailDev is ready before email tests run.
	 * @param timeoutMs
	 * Maximum time to wait in milliseconds.
	 * @throws
	 * Error if MailDev does not respond within the timeout.
	 */
	static async waitUntilReady(timeoutMs: number = 15000): Promise<void>
	{
		const pollingIntervalMs: number = 500;
		const startTime: number =
			Date.now();

		while (Date.now() - startTime < timeoutMs)
		{
			try
			{
				const response: Response =
					await fetch(`${this.MAILDEV_API_URL}/email`);

				if (response.ok)
				{
					return;
				}
			}
			catch
			{
				// MailDev not ready yet — retry
			}

			await new Promise(
				(resolve) => setTimeout(resolve, pollingIntervalMs));
		}

		throw new Error(
			`MailDev did not become available within ${timeoutMs}ms at ${this.MAILDEV_API_URL}`);
	}

	/**
	 * Gets all captured emails.
	 * @returns
	 * Array of captured emails.
	 */
	static async getAllEmails(): Promise<MailDevEmail[]>
	{
		const response: Response =
			await fetch(`${this.MAILDEV_API_URL}/email`);

		return response.json();
	}

	/**
	 * Gets emails for a specific recipient.
	 * @param recipientEmail
	 * The email address to filter by.
	 * @returns
	 * Array of emails sent to the recipient.
	 */
	static async getEmailsForRecipient(recipientEmail: string): Promise<MailDevEmail[]>
	{
		const allEmails: MailDevEmail[] =
			await this.getAllEmails();

		return allEmails.filter(
			(email) => email
				.to
				.some(
					(recipient) => recipient.address === recipientEmail));
	}

	/**
	 * Waits for an email to arrive for a recipient.
	 * @param recipientEmail
	 * The email address to wait for.
	 * @param timeoutMs
	 * Maximum time to wait in milliseconds.
	 * @returns
	 * The first email found for the recipient.
	 * @throws
	 * Error if email not received within timeout.
	 */
	static async waitForEmail(
		recipientEmail: string,
		options: { timeout?: number } = {}): Promise<MailDevEmail>
	{
		const timeoutMs: number =
			options.timeout ?? 10000;
		const startTime: number =
			Date.now();

		while (Date.now() - startTime < timeoutMs)
		{
			const emails: MailDevEmail[] =
				await this.getEmailsForRecipient(recipientEmail);

			if (emails.length > 0)
			{
				return emails[0];
			}

			await new Promise(
				(resolve) => setTimeout(resolve, 500));
		}

		throw new Error(`Timeout waiting for email to ${recipientEmail}`);
	}

	/**
	 * Deletes all captured emails.
	 * Call in test setup for clean state.
	 */
	static async clearAllEmails(): Promise<void>
	{
		await fetch(
			`${this.MAILDEV_API_URL}/email/all`,
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
		email: MailDevEmail,
		linkPattern: RegExp): string | null
	{
		const match: RegExpMatchArray | null =
			email.html.match(linkPattern);

		return match ? match[1] : null;
	}
}
