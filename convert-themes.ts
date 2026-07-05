import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { convertOpenCodeToPiTheme, type OpenCodeThemeJson } from "./theme-converter.ts";

const baseDir = dirname(fileURLToPath(import.meta.url));
const opencodeAssetsDir = join(
	baseDir,
	"..",
	"opencode",
	"packages",
	"tui",
	"src",
	"theme",
	"assets",
);
const themesDir = join(baseDir, "themes");

const themeNames = ["opencode", "tokyonight", "dracula", "gruvbox", "catppuccin"];

for (const name of themeNames) {
	const ocPath = join(opencodeAssetsDir, `${name}.json`);
	const piPath = join(themesDir, `${name}.json`);

	const oc = JSON.parse(readFileSync(ocPath, "utf8")) as OpenCodeThemeJson;
	const pi = convertOpenCodeToPiTheme(oc, name, "dark");

	writeFileSync(piPath, `${JSON.stringify(pi, null, "\t")}\n`);
	console.log(`Converted ${name}.json`);
}

console.log("Done.");
