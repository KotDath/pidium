import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";

export function applyThemeByName(ui: ExtensionUIContext, name: string): boolean {
	const theme = ui.getTheme(name);
	if (!theme) return false;

	ui.setTheme(theme);
	return true;
}
