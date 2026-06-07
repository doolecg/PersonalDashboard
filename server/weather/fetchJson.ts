export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Weather request failed with ${response.status} for ${url}`);
  }

  return response.json() as Promise<T>;
}
