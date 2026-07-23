import * as fs from "node:fs";
import * as os from "node:os";
import { join } from "node:path";

const pidiumStateDir = join(os.homedir(), ".pi", "agent");
const savedThemePath = join(pidiumStateDir, "pidium-theme.json");

export function loadSavedThemeName(): string | undefined {
	try {
		return JSON.parse(fs.readFileSync(savedThemePath, "utf8")).theme as string;
	} catch {
		return undefined;
	}
}

export function saveThemeName(name: string): void {
	fs.mkdirSync(pidiumStateDir, { recursive: true });
	fs.writeFileSync(savedThemePath, JSON.stringify({ theme: name }, null, "\t"));
}
