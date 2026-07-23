import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { applyThemeByName } from "./apply.ts";
import { createThemesCommandHandler, createThemesShortcutHandler } from "./command.ts";
import { THEME_FILES, THEMES_DIR } from "./files.ts";
import { loadSavedThemeName } from "./store.ts";

export function registerThemesFeature(pi: ExtensionAPI): void {
	pi.on("resources_discover", (_event, ctx) => {
		const saved = loadSavedThemeName();
		if (saved) {
			const ui = ctx.ui;
			setTimeout(() => {
				applyThemeByName(ui, saved);
			}, 0);
		}

		return {
			themePaths: THEME_FILES.map((file) => join(THEMES_DIR, file)),
		};
	});

	const handler = createThemesCommandHandler();
	const shortcutHandler = createThemesShortcutHandler();

	pi.registerCommand("themes", {
		description: "Open the theme selector overlay",
		handler,
	});

	pi.registerShortcut("f10", {
		description: "Open the theme selector overlay",
		handler: shortcutHandler,
	});
}
