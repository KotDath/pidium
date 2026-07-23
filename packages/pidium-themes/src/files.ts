import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export const THEMES_DIR = join(PACKAGE_ROOT, "themes");

export const THEME_FILES = ["opencode.json", "tokyonight.json", "dracula.json", "gruvbox.json", "catppuccin.json"];
