/**
 * Pidium — OpenCode theme pack for Pi.
 *
 * Registers a set of themes via resources_discover and adds a `/themes` command
 * with live preview.
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import * as os from "node:os";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
	ExtensionUIContext,
	Theme,
} from "@earendil-works/pi-coding-agent";
import {
	type Focusable,
	matchesKey,
	truncateToWidth,
	type TUI,
	visibleWidth,
} from "@earendil-works/pi-tui";

const baseDir = dirname(fileURLToPath(import.meta.url));
const pidiumStateDir = join(os.homedir(), ".pi", "agent");
const savedThemePath = join(pidiumStateDir, "pidium-theme.json");

function loadSavedThemeName(): string | undefined {
	try {
		return JSON.parse(fs.readFileSync(savedThemePath, "utf8")).theme as string;
	} catch {
		return undefined;
	}
}

function saveThemeName(name: string): void {
	fs.mkdirSync(pidiumStateDir, { recursive: true });
	fs.writeFileSync(savedThemePath, JSON.stringify({ theme: name }, null, "\t"));
}

function hexToXtermColor(hex: string): string {
	const clean = hex.replace("#", "");
	const r = clean.slice(0, 2);
	const g = clean.slice(2, 4);
	const b = clean.slice(4, 6);
	return `rgb:${r}/${g}/${b}`;
}

function setTerminalBackground(hex: string | undefined): void {
	if (!hex) return;
	process.stdout.write(`\x1b]11;${hexToXtermColor(hex)}\x07`);
}

function getThemeBackground(theme: Theme): string | undefined {
	const exportColors = (theme as unknown as { export?: { pageBg?: string } }).export;
	return exportColors?.pageBg;
}

function applyThemeByName(ui: ExtensionUIContext, name: string): boolean {
	const theme = ui.getTheme(name);
	if (!theme) return false;

	ui.setTheme(theme);
	setTerminalBackground(getThemeBackground(theme));
	return true;
}

const THEME_FILES = [
	"opencode.json",
	"tokyonight.json",
	"dracula.json",
	"gruvbox.json",
	"catppuccin.json",
];

export default function (pi: ExtensionAPI) {
	pi.on("resources_discover", (_event, ctx) => {
		const saved = loadSavedThemeName();
		if (saved) {
			const ui = ctx.ui;
			setTimeout(() => {
				applyThemeByName(ui, saved);
			}, 0);
		}

		return {
			themePaths: THEME_FILES.map((file) => join(baseDir, "themes", file)),
		};
	});

	pi.on("session_shutdown", () => {
		process.stdout.write("\x1b]111\x07");
	});

	const openSelector = async (_args: string, ctx: ExtensionCommandContext) => {
		const ui = ctx.ui;
		if (ctx.mode !== "tui" || !ctx.hasUI || !ui) {
			ctx.ui?.notify("Theme selector requires the TUI", "warning");
			return;
		}

		const themes = ui
			.getAllThemes()
			.filter((t) => t.path?.includes("/pidium/themes/"))
			.sort((a, b) => a.name.localeCompare(b.name));
		const initialTheme = ui.theme;

		const selectedName = await ui.custom<string | undefined>(
			(tui, _theme, _keybindings, done) =>
				new ThemeSelectorComponent(tui, ui, themes, initialTheme, done),
		);

		if (selectedName) {
			saveThemeName(selectedName);
			applyThemeByName(ui, selectedName);
			ui.notify(`Theme set to ${selectedName}`, "info");
		}
	};

	const openSelectorFromShortcut = (ctx: ExtensionCommandContext) => openSelector("", ctx);

	pi.registerCommand("themes", {
		description: "Open the theme selector overlay",
		handler: openSelector,
	});

	pi.registerShortcut("f10", {
		description: "Open the theme selector overlay",
		handler: openSelectorFromShortcut,
	});
}

class ThemeSelectorComponent implements Focusable {
	readonly width = 60;
	focused = false;

	private tui: TUI;
	private ui: ExtensionUIContext;
	private themes: { name: string; path: string | undefined }[];
	private initialTheme: Theme;
	private done: (result: string | undefined) => void;

	private selectedIndex = 0;
	private scrollOffset = 0;
	private readonly maxVisible = 12;
	private errorMessage: string | undefined;

	constructor(
		tui: TUI,
		ui: ExtensionUIContext,
		themes: { name: string; path: string | undefined }[],
		initialTheme: Theme,
		done: (result: string | undefined) => void,
	) {
		this.tui = tui;
		this.ui = ui;
		this.themes = themes;
		this.initialTheme = initialTheme;
		this.done = done;

		const startIndex = themes.findIndex((t) => t.name === initialTheme.name);
		this.selectedIndex = startIndex >= 0 ? startIndex : 0;
		this.syncScroll();
	}

	handleInput(data: string): void {
		if (matchesKey(data, "escape")) {
			this.ui.setTheme(this.initialTheme);
			setTerminalBackground(getThemeBackground(this.initialTheme));
			this.done(undefined);
			return;
		}

		if (matchesKey(data, "return")) {
			const selected = this.themes[this.selectedIndex];
			if (selected) {
				applyThemeByName(this.ui, selected.name);
			}
			this.done(selected?.name);
			return;
		}

		if (this.themes.length === 0) {
			return;
		}

		if (matchesKey(data, "up")) {
			this.selectedIndex =
				this.selectedIndex === 0 ? this.themes.length - 1 : this.selectedIndex - 1;
		} else if (matchesKey(data, "down")) {
			this.selectedIndex =
				this.selectedIndex === this.themes.length - 1 ? 0 : this.selectedIndex + 1;
		} else {
			return;
		}

		const name = this.themes[this.selectedIndex]?.name;
		if (name) {
			this.applyTheme(name);
		}
	}

	render(_width: number): string[] {
		const theme = this.ui.theme;
		const innerW = this.width - 2;
		const lines: string[] = [];

		const pad = (s: string, len: number): string => {
			const vis = visibleWidth(s);
			return s + " ".repeat(Math.max(0, len - vis));
		};

		const row = (content: string): string =>
			theme.fg("border", "│") + pad(content, innerW) + theme.fg("border", "│");

		lines.push(theme.fg("border", `╭${"─".repeat(innerW)}╮`));
		lines.push(row(` ${theme.fg("accent", theme.bold("Select Theme"))}`));
		lines.push(row(""));

		const total = this.themes.length;
		const start = this.scrollOffset;
		const end = Math.min(start + this.maxVisible, total);

		if (total === 0) {
			lines.push(row(theme.fg("dim", "  No themes available")));
		} else {
			for (let i = start; i < end; i++) {
				const item = this.themes[i];
				if (!item) continue;

				const isSelected = i === this.selectedIndex;
				const isActive = item.name === theme.name;
				const marker = isSelected ? "> " : "  ";
				const check = isActive ? theme.fg("success", " *") : "";
				const label = `${marker}${item.name}${check}`;
				const styled = isSelected ? theme.fg("accent", label) : theme.fg("text", label);

				lines.push(row(` ${styled}`));
			}
		}

		if (total > this.maxVisible) {
			lines.push(row(` ${theme.fg("dim", `${start + 1}-${end} / ${total}`)}`));
		}

		if (this.errorMessage) {
			const wrapped = truncateToWidth(this.errorMessage, innerW - 1);
			lines.push(row(` ${theme.fg("error", wrapped)}`));
		}

		lines.push(row(""));
		lines.push(row(` ${theme.fg("dim", "↑↓ navigate • Enter confirm • Esc cancel")}`));
		lines.push(theme.fg("border", `╰${"─".repeat(innerW)}╯`));

		return lines;
	}

	invalidate(): void {}

	dispose(): void {}

	private applyTheme(name: string): void {
		if (applyThemeByName(this.ui, name)) {
			this.errorMessage = undefined;
		} else {
			this.errorMessage = `Theme not found: ${name}`;
		}
		this.tui.requestRender();
		this.syncScroll();
	}

	private syncScroll(): void {
		if (this.selectedIndex < this.scrollOffset) {
			this.scrollOffset = this.selectedIndex;
		} else if (this.selectedIndex >= this.scrollOffset + this.maxVisible) {
			this.scrollOffset = Math.max(0, this.selectedIndex - this.maxVisible + 1);
		}
	}
}
