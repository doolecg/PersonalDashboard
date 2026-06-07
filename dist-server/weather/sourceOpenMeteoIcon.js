import { fetchJson } from "./fetchJson.js";
import { buildOpenMeteoUrl } from "./sourceOpenMeteoUkmo.js";
export async function fetchOpenMeteoIcon(latitude, longitude) {
    return fetchJson(buildOpenMeteoUrl(latitude, longitude, "icon_seamless"));
}
