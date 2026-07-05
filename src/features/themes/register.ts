import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { THEME_FILES } from "./files.ts";
import { loadSavedThemeName } from "./store.ts";
import { applyThemeByName } from "./apply.ts";
import {
	createThemesCommandHandler,
	createThemesShortcutHandler,
} from "./command.ts";

const baseDir = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

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
			themePaths: THEME_FILES.map((file) => join(baseDir, "themes", file)),
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
