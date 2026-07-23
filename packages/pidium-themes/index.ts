import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerThemesFeature } from "./src/register.ts";

export default function (pi: ExtensionAPI) {
	registerThemesFeature(pi);
}
