/**
 * OpenCode TUI theme -> Pi TUI theme converter.
 *
 * Takes an OpenCode theme JSON (with `defs` and dark/light `theme` tokens) and
 * produces a Pi theme JSON that can be registered via `resources_discover`.
 */

export type OpenCodeColorValue = string | { dark: string; light: string };

export type OpenCodeThemeJson = {
	$schema?: string;
	defs?: Record<string, string>;
	theme: Record<string, OpenCodeColorValue>;
};

export type PiThemeJson = {
	$schema: string;
	name: string;
	vars: Record<string, string>;
	colors: Record<string, string>;
	export: {
		pageBg: string;
		cardBg: string;
		infoBg: string;
	};
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const clean = hex.replace("#", "");
	return {
		r: parseInt(clean.slice(0, 2), 16),
		g: parseInt(clean.slice(2, 4), 16),
		b: parseInt(clean.slice(4, 6), 16),
	};
}

function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function mix(fg: string, bg: string, alpha: number): string {
	const f = hexToRgb(fg);
	const b = hexToRgb(bg);
	return rgbToHex(
		b.r + (f.r - b.r) * alpha,
		b.g + (f.g - b.g) * alpha,
		b.b + (f.b - b.b) * alpha,
	);
}

export function resolveOpenCodeColor(
	raw: OpenCodeColorValue,
	defs: Record<string, string>,
	theme: Record<string, OpenCodeColorValue>,
	mode: "dark" | "light",
	chain: string[] = [],
): string {
	let value: unknown = raw;

	while (true) {
		if (typeof value === "string") {
			if (value.startsWith("#")) return value;

			if (chain.includes(value)) {
				throw new Error(`Circular color reference: ${[...chain, value].join(" -> ")}`);
			}

			const next = defs[value] ?? theme[value];
			if (next === undefined) {
				throw new Error(`Unknown OpenCode color reference: ${value}`);
			}

			chain.push(value);
			value = next;
			continue;
		}

		if (value && typeof value === "object" && mode in value) {
			value = (value as { dark: string; light: string })[mode];
			continue;
		}

		throw new Error(`Invalid OpenCode color value: ${JSON.stringify(value)}`);
	}
}

export function convertOpenCodeToPiTheme(
	oc: OpenCodeThemeJson,
	name: string,
	mode: "dark" | "light" = "dark",
): PiThemeJson {
	const defs = oc.defs ?? {};
	const theme = oc.theme;

	const c = (token: string, fallback?: string): string => {
		const raw = theme[token] ?? fallback;
		if (raw === undefined) throw new Error(`Missing OpenCode token: ${token}`);
		return resolveOpenCodeColor(raw, defs, theme, mode);
	};

	const primary = c("primary");
	const secondary = c("secondary");
	const accent = c("accent");
	const success = c("success");
	const error = c("error");
	const warning = c("warning");
	const info = c("info");
	const text = c("text");
	const textMuted = c("textMuted");

	const background = c("background");
	const backgroundPanel = c("backgroundPanel");
	const backgroundElement = c("backgroundElement");
	const border = c("border");
	const borderActive = c("borderActive");
	const borderSubtle = c("borderSubtle");

	return {
		$schema: "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
		name,
		vars: {
			primary,
			secondary,
			accent,
			success,
			error,
			warning,
			info,
			text,
			textMuted,
			background,
			backgroundPanel,
			backgroundElement,
			border,
			borderActive,
			borderSubtle,
		},
		colors: {
			accent: "primary",
			border: "border",
			borderAccent: "borderActive",
			borderMuted: "borderSubtle",

			success: "success",
			error: "error",
			warning: "warning",
			muted: "textMuted",
			dim: "textMuted",
			text: "text",
			thinkingText: "textMuted",

			selectedBg: "backgroundElement",
			userMessageBg: "backgroundPanel",
			userMessageText: "text",
			customMessageBg: mix(secondary, backgroundPanel, 0.08),
			customMessageText: "text",
			customMessageLabel: "secondary",
			toolPendingBg: "backgroundPanel",
			toolSuccessBg: mix(success, backgroundPanel, 0.18),
			toolErrorBg: mix(error, backgroundPanel, 0.18),
			toolTitle: "text",
			toolOutput: "textMuted",

			mdHeading: c("markdownHeading", accent),
			mdLink: c("markdownLink", primary),
			mdLinkUrl: c("markdownLinkText", secondary),
			mdCode: c("markdownCode", success),
			mdCodeBlock: c("markdownCodeBlock", text),
			mdCodeBlockBorder: "borderSubtle",
			mdQuote: c("markdownBlockQuote", warning),
			mdQuoteBorder: "borderSubtle",
			mdHr: c("markdownHorizontalRule", borderSubtle),
			mdListBullet: c("markdownListItem", primary),

			toolDiffAdded: c("diffAdded", success),
			toolDiffRemoved: c("diffRemoved", error),
			toolDiffContext: c("diffContext", textMuted),

			syntaxComment: c("syntaxComment", textMuted),
			syntaxKeyword: c("syntaxKeyword", accent),
			syntaxFunction: c("syntaxFunction", primary),
			syntaxVariable: c("syntaxVariable", error),
			syntaxString: c("syntaxString", success),
			syntaxNumber: c("syntaxNumber", warning),
			syntaxType: c("syntaxType", warning),
			syntaxOperator: c("syntaxOperator", info),
			syntaxPunctuation: c("syntaxPunctuation", text),

			thinkingOff: "borderSubtle",
			thinkingMinimal: "textMuted",
			thinkingLow: "info",
			thinkingMedium: "secondary",
			thinkingHigh: "accent",
			thinkingXhigh: "primary",

			bashMode: "success",
		},
		export: {
			pageBg: background,
			cardBg: backgroundPanel,
			infoBg: mix(warning, background, 0.12),
		},
	};
}
