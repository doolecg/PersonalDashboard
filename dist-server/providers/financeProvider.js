import { emptyFinance } from "./emptyData.js";
import { providerResult } from "./providerResult.js";
export async function getFinanceSummary() {
    return providerResult("empty", emptyFinance, "Finance provider disabled");
}
