import { env } from "../env.js";
import { getAccessToken } from "./oauth.js";

// Mapped to the same shape as the client's CalendarEvent.
export type GoogleCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  description?: string;
  category?: string;
};

type GoogleApiEvent = {
  id: string;
  summary?: string;
  location?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

export async function listGoogleEvents(): Promise<GoogleCalendarEvent[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.googleCalendarId)}/events`);
  url.searchParams.set("timeMin", new Date().toISOString());
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Google Calendar request failed with ${response.status}`);

  const data = (await response.json()) as { items?: GoogleApiEvent[] };
  return (data.items ?? [])
    .map((item) => ({
      id: item.id,
      title: item.summary ?? "(no title)",
      start: item.start?.dateTime ?? item.start?.date ?? "",
      end: item.end?.dateTime ?? item.end?.date,
      location: item.location,
      description: item.description,
      category: "Google"
    }))
    .filter((event) => event.start);
}
