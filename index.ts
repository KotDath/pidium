import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerThemesFeature } from "./src/features/themes/index.ts";

export default function (pi: ExtensionAPI) {
	registerThemesFeature(pi);
	// registerWebSearchFeature(pi);
	// registerSubagentsFeature(pi);
	// registerMonitorFeature(pi);
	// registerStateFeature(pi);
}
