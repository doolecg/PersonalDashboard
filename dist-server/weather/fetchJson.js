export async function fetchJson(url, init) {
    const response = await fetch(url, init);
    if (!response.ok) {
        throw new Error(`Weather request failed with ${response.status} for ${url}`);
    }
    return response.json();
}
