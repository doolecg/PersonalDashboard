import { providerResult } from "./providerResult.js";
export async function getCalendarToday() {
    return providerResult("empty", [], "Calendar provider disabled");
}
