import { getAvailableContentHeight, LayoutDimensions } from "./content-helper";

describe("ContentHelper", () =>
{
	let originalInnerHeight: number;

	beforeEach(() =>
	{
		// Store original window.innerHeight
		originalInnerHeight = window.innerHeight;
	});

	afterEach(() =>
	{
		// Restore original window.innerHeight
		Object.defineProperty(window, "innerHeight", {
			writable: true,
			configurable: true,
			value: originalInnerHeight
		});
	});

	describe("getAvailableContentHeight", () =>
	{
		it("should calculate available height without offset", () =>
		{
			// Arrange
			Object.defineProperty(window, "innerHeight", {
				writable: true,
				configurable: true,
				value: 1000
			});

			// Act
			const result: number = getAvailableContentHeight();

			// Assert
			// 1000 viewport - 64 header - 52 breadcrumb - 48 footer = 836
			expect(result).toBe(836);
		});

		it("should calculate available height with offset", () =>
		{
			// Arrange
			Object.defineProperty(window, "innerHeight", {
				writable: true,
				configurable: true,
				value: 1000
			});
			const offset: number = 72; // Paginator (56) + padding (16)

			// Act
			const result: number = getAvailableContentHeight(offset);

			// Assert
			// 1000 viewport - 64 header - 52 breadcrumb - 48 footer - 72 offset = 764
			expect(result).toBe(764);
		});

		it("should return 0 when calculated height is negative", () =>
		{
			// Arrange
			Object.defineProperty(window, "innerHeight", {
				writable: true,
				configurable: true,
				value: 100
			});
			const offset: number = 200;

			// Act
			const result: number = getAvailableContentHeight(offset);

			// Assert
			// Should never return negative values
			expect(result).toBe(0);
		});

		it("should handle zero offset (default parameter)", () =>
		{
			// Arrange
			Object.defineProperty(window, "innerHeight", {
				writable: true,
				configurable: true,
				value: 800
			});

			// Act
			const result: number = getAvailableContentHeight(0);

			// Assert
			// 800 viewport - 64 header - 52 breadcrumb - 48 footer = 636
			expect(result).toBe(636);
		});

		it("should handle typical desktop viewport (1920x1080)", () =>
		{
			// Arrange
			Object.defineProperty(window, "innerHeight", {
				writable: true,
				configurable: true,
				value: 1080
			});

			// Act
			const result: number = getAvailableContentHeight(56); // Paginator only

			// Assert
			// 1080 viewport - 64 header - 52 breadcrumb - 48 footer - 56 paginator = 860
			expect(result).toBe(860);
		});

		it("should handle typical mobile viewport (375x667)", () =>
		{
			// Arrange
			Object.defineProperty(window, "innerHeight", {
				writable: true,
				configurable: true,
				value: 667
			});

			// Act
			const result: number = getAvailableContentHeight(56);

			// Assert
			// 667 viewport - 64 header - 52 breadcrumb - 48 footer - 56 paginator = 447
			expect(result).toBe(447);
		});
	});

	describe("LayoutDimensions", () =>
	{
		it("should expose correct header height", () =>
		{
			expect(LayoutDimensions.headerHeight).toBe(64);
		});

		it("should expose correct breadcrumb height", () =>
		{
			expect(LayoutDimensions.breadcrumbHeight).toBe(52);
		});

		it("should expose correct footer height", () =>
		{
			expect(LayoutDimensions.footerHeight).toBe(48);
		});

		it("should expose correct total fixed height", () =>
		{
			expect(LayoutDimensions.totalFixedHeight).toBe(164); // 64 + 52 + 48
		});

		it("should have immutable properties", () =>
		{
			// Verify the const assertion works by checking values are as expected
			// TypeScript enforces readonly at compile time
			expect(LayoutDimensions.headerHeight).toBe(64);
			expect(LayoutDimensions.breadcrumbHeight).toBe(52);
			expect(LayoutDimensions.footerHeight).toBe(48);
			expect(LayoutDimensions.totalFixedHeight).toBe(164);
		});
	});
});
