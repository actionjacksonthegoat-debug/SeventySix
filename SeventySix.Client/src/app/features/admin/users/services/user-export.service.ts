/**
 * User Export Service
 * Handles CSV export functionality for user data
 * Follows SRP - Single Responsibility: User data export
 */

import { Injectable } from "@angular/core";
import { User } from "@admin/users/models";

/**
 * Provided at route level for proper garbage collection (see admin.routes.ts)
 */
@Injectable()
export class UserExportService
{
	/**
	 * Export users to CSV format
	 * @param users - Array of users to export
	 * @param filename - Optional filename (defaults to timestamp)
	 */
	exportToCsv(users: User[], filename?: string): void
	{
		if (users.length === 0)
		{
			return;
		}

		const csvContent: string = this.generateCsvContent(users);
		const csvFilename: string =
			filename || `users_export_${new Date().toISOString()}.csv`;

		this.downloadCsv(csvContent, csvFilename);
	}

	/**
	 * Generate CSV content from user array
	 * @param users - Array of users
	 * @returns CSV string
	 */
	private generateCsvContent(users: User[]): string
	{
		const headers: string[] = [
			"ID",
			"Username",
			"Email",
			"Full Name",
			"Status",
			"Created At",
			"Last Login",
			"Modified At",
			"Created By",
			"Modified By"
		];

		const rows: string[][] = users.map((user) => [
			user.id.toString(),
			this.escapeCsvValue(user.username),
			this.escapeCsvValue(user.email),
			this.escapeCsvValue(user.fullName || ""),
			user.isActive ? "Active" : "Inactive",
			user.createDate,
			user.lastLoginAt || "Never",
			user.modifyDate || "",
			user.createdBy || "",
			user.modifiedBy || ""
		]);

		const csvLines: string[] = [
			headers.join(","),
			...rows.map((row) => row.join(","))
		];

		return csvLines.join("\n");
	}

	/**
	 * Escape CSV value for proper formatting
	 * Handles quotes and commas
	 * @param value - Value to escape
	 * @returns Escaped value
	 */
	private escapeCsvValue(value: string): string
	{
		if (
			value.includes(",") ||
			value.includes('"') ||
			value.includes("\n")
		)
		{
			return `"${value.replace(/"/g, '""')}"`;
		}
		return value;
	}

	/**
	 * Trigger browser download of CSV file
	 * @param content - CSV content
	 * @param filename - Filename for download
	 */
	private downloadCsv(content: string, filename: string): void
	{
		const blob: Blob = new Blob([content], {
			type: "text/csv;charset=utf-8;"
		});
		const link: HTMLAnchorElement = document.createElement("a");

		if (link.download !== undefined)
		{
			const url: string = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", filename);
			link.style.visibility = "hidden";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}
	}
}
