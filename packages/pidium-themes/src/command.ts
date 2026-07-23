import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { applyThemeByName } from "./apply.ts";
import { THEMES_DIR } from "./files.ts";
import { ThemeSelectorComponent } from "./selector/component.ts";
import { saveThemeName } from "./store.ts";

export function createThemesCommandHandler(): (args: string, ctx: ExtensionContext) => Promise<void> {
	return async (_args: string, ctx: ExtensionContext) => {
		const ui = ctx.ui;
		if (ctx.mode !== "tui" || !ctx.hasUI || !ui) {
			ctx.ui?.notify("Theme selector requires the TUI", "warning");
			return;
		}

		const themes = ui
			.getAllThemes()
			.filter((t) => t.path?.startsWith(THEMES_DIR))
			.sort((a, b) => a.name.localeCompare(b.name));
		const initialTheme = ui.theme;

		const selectedName = await ui.custom<string | undefined>(
			(tui, _theme, _keybindings, done) => new ThemeSelectorComponent(tui, ui, themes, initialTheme, done),
		);

		if (selectedName) {
			saveThemeName(selectedName);
			applyThemeByName(ui, selectedName);
			ui.notify(`Theme set to ${selectedName}`, "info");
		}
	};
}

export function createThemesShortcutHandler(): (ctx: ExtensionContext) => Promise<void> {
	const handler = createThemesCommandHandler();
	return async (ctx: ExtensionContext) => handler("", ctx);
}
