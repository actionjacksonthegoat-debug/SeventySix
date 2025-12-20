/**
 * Unit tests for snackbar utility.
 * Tests consistent snackbar configuration and behavior.
 */

import { MatSnackBar } from "@angular/material/snack-bar";
import { SNACKBAR_DURATION, SnackbarType } from "@shared/constants/snackbar.constants";
import { showSnackbar } from "@shared/utilities/snackbar.utility";

describe("showSnackbar",
	() =>
	{
		let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

		beforeEach(
			() =>
			{
				mockSnackBar =
					jasmine.createSpyObj("MatSnackBar",
						["open"]);
			});

		it("should show success message with 3 second duration",
			() =>
			{
				showSnackbar(
					mockSnackBar,
					"Success message",
					SnackbarType.Success);

				expect(mockSnackBar.open)
					.toHaveBeenCalledWith(
						"Success message",
						"Close",
						jasmine.objectContaining(
							{
								duration: 3000,
								horizontalPosition: "end",
								verticalPosition: "top"
							}));
			});

		it("should show error message with 5 second duration",
			() =>
			{
				showSnackbar(
					mockSnackBar,
					"Error message",
					SnackbarType.Error);

				expect(mockSnackBar.open)
					.toHaveBeenCalledWith(
						"Error message",
						"Close",
						jasmine.objectContaining(
							{
								duration: SNACKBAR_DURATION.error,
								horizontalPosition: "end",
								verticalPosition: "top"
							}));
			});

		it("should default to success type",
			() =>
			{
				showSnackbar(mockSnackBar, "Default message");

				expect(mockSnackBar.open)
					.toHaveBeenCalledWith(
						"Default message",
						"Close",
						jasmine.objectContaining(
							{ duration: SNACKBAR_DURATION.success }));
			});

		it("should use consistent positioning for all messages",
			() =>
			{
				showSnackbar(
					mockSnackBar,
					"Test message",
					SnackbarType.Error);

				expect(mockSnackBar.open)
					.toHaveBeenCalledWith(
						jasmine.any(String),
						jasmine.any(String),
						jasmine.objectContaining(
							{
								horizontalPosition: "end",
								verticalPosition: "top"
							}));
			});
	});
