const geocodeBaseUrl = "https://geocoding-api.open-meteo.com/v1/search";
// Resolve a free-text place name to coordinates via Open-Meteo's geocoding API.
export async function geocodePlace(query, count = 5) {
    const trimmed = query.trim();
    if (!trimmed)
        return [];
    const url = new URL(geocodeBaseUrl);
    url.searchParams.set("name", trimmed);
    url.searchParams.set("count", String(count));
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok)
            throw new Error(`Geocoding failed with ${response.status}`);
        const data = (await response.json());
        return (data.results ?? []).map((result) => ({
            name: result.name,
            latitude: result.latitude,
            longitude: result.longitude,
            country: result.country,
            admin1: result.admin1,
            label: [result.name, result.admin1, result.country].filter(Boolean).join(", ")
        }));
    }
    finally {
        clearTimeout(timeout);
    }
}
