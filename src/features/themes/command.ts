import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { saveThemeName } from "./store.ts";
import { applyThemeByName } from "./apply.ts";
import { ThemeSelectorComponent } from "./selector/index.ts";

export function createThemesCommandHandler(): (
	args: string,
	ctx: ExtensionCommandContext,
) => Promise<void> {
	return async (_args: string, ctx: ExtensionCommandContext) => {
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
}

export function createThemesShortcutHandler(): (
	ctx: ExtensionCommandContext,
) => Promise<void> {
	const handler = createThemesCommandHandler();
	return async (ctx: ExtensionCommandContext) => handler("", ctx);
}
