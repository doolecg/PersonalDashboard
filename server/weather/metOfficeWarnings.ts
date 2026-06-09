export type MetOfficeWarning = {
  message: string;
  severity: "yellow" | "amber" | "red";
  type: string;
};

const RSS_URL = "https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-extreme-events/rss";
const CACHE_TTL_MS = 30 * 60 * 1000;
let cache: { at: number; data: MetOfficeWarning[] } | null = null;

const SEVERITY_RE = /\b(red|amber|yellow)\b/i;
const TYPE_RE = /Warning\s+of\s+([A-Za-z ]+?)(?:\s+for|\s*$)/i;
const ITEM_RE = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
const TITLE_RE = /<title>([\s\S]*?)<\/title>/i;
const CDATA_RE = /<!\[CDATA\[([\s\S]*?)\]\]>/;

function extractText(xml: string): string {
  const cdata = xml.match(CDATA_RE);
  return (cdata ? cdata[1] : xml).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseWarnings(xml: string): MetOfficeWarning[] {
  const warnings: MetOfficeWarning[] = [];
  for (const match of xml.matchAll(ITEM_RE)) {
    const itemXml = match[1] ?? "";
    const rawTitle = itemXml.match(TITLE_RE)?.[1] ?? "";
    const title = extractText(rawTitle);

    const sevMatch = title.match(SEVERITY_RE);
    if (!sevMatch) continue;
    const severity = sevMatch[1].toLowerCase() as "yellow" | "amber" | "red";

    const typeMatch = title.match(TYPE_RE);
    const type = typeMatch ? typeMatch[1].trim() : "Weather";

    // Extract region — everything after "for " in the title
    const forIdx = title.toLowerCase().indexOf(" for ");
    const region = forIdx !== -1 ? title.slice(forIdx + 5).trim() : "";

    const message = region
      ? `${severity.charAt(0).toUpperCase() + severity.slice(1)} warning: ${type}${region ? ` — ${region}` : ""}`
      : `${severity.charAt(0).toUpperCase() + severity.slice(1)} warning: ${type}`;

    warnings.push({ message, severity, type });
  }
  return warnings;
}

export async function fetchMetOfficeWarnings(): Promise<MetOfficeWarning[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  try {
    const res = await fetch(RSS_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AuraDashboard/1.0)", Accept: "application/rss+xml, */*" },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`Met Office RSS ${res.status}`);
    const xml = await res.text();
    const data = parseWarnings(xml);
    cache = { at: Date.now(), data };
    return data;
  } catch {
    return cache?.data ?? [];
  }
}
