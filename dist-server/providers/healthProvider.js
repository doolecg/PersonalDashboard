import { emptyHealth } from "./emptyData.js";
import { providerResult } from "./providerResult.js";
export async function getHealth() {
    return providerResult("empty", emptyHealth, "Health provider disabled");
}
