import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cardBehaviorConstants } from "../src/constants";
import { CalendarMonthCard } from "../src/features/cards/calendar/CalendarMonthCard";
import { CalendarPlannerCard } from "../src/features/cards/calendar/CalendarPlannerCard";
import { UpcomingEventsCard } from "../src/features/cards/calendar/UpcomingEventsCard";
import type { CalendarEvent } from "../src/features/cards/calendar/types";
import { cardRegistry } from "../src/features/cards/registry";

const calendarEventsMock = vi.fn<() => CalendarEvent[]>();

vi.mock("../src/features/cards/calendar/useCalendarEvents", () => ({
  useCalendarEvents: () => calendarEventsMock()
}));

const calendarEvents: CalendarEvent[] = [
  {
    id: "ops-review",
    title: "Ops review",
    start: "2026-06-07T10:00:00Z",
    end: "2026-06-07T10:45:00Z",
    location: "Command deck",
    description: "Review route health and cargo exceptions.",
    category: "Operations"
  },
  {
    id: "dock-window",
    title: "Docking window",
    start: "2026-06-09T14:00:00Z",
    end: "2026-06-09T15:00:00Z",
    location: "Orbital berth 3",
    category: "Logistics"
  }
];

describe("calendar cards", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T09:00:00Z"));
    calendarEventsMock.mockReturnValue(calendarEvents);
  });

  afterEach(() => {
    vi.useRealTimers();
    calendarEventsMock.mockReset();
  });

  it("registers every calendar card with all supported footprints", () => {
    const ids = cardRegistry.map((card) => card.id);

    expect(ids).toEqual(expect.arrayContaining(["calendar-month", "calendar-upcoming", "calendar-planner"]));
    expect(cardBehaviorConstants["calendar-month"]?.allowedFootprints).toEqual(["1x1", "1x2", "2x1", "2x2", "4x2", "4x4"]);
    expect(cardBehaviorConstants["calendar-upcoming"]?.allowedFootprints).toEqual(["1x1", "1x2", "2x1", "2x2", "4x2", "4x4"]);
    expect(cardBehaviorConstants["calendar-planner"]?.allowedFootprints).toEqual(["1x1", "1x2", "2x1", "2x2", "4x2", "4x4"]);
  });

  it("renders a normal month calendar with event markers across compact and large footprints", () => {
    const compact = renderToStaticMarkup(<CalendarMonthCard footprint="1x1" />);
    const large = renderToStaticMarkup(<CalendarMonthCard footprint="4x4" />);

    expect(compact).toContain("data-calendar-footprint=\"1x1\"");
    expect(compact).toContain("Jun 2026");
    expect(compact).toContain("data-calendar-event-day=\"2026-06-07\"");
    expect(large).toContain("data-calendar-footprint=\"4x4\"");
    expect(large).toContain("Ops review");
  });

  it("renders upcoming events and a real empty state", () => {
    const markup = renderToStaticMarkup(<UpcomingEventsCard footprint="2x1" />);

    expect(markup).toContain("Upcoming events");
    expect(markup).toContain("Ops review");
    expect(markup).toContain("Command deck");

    calendarEventsMock.mockReturnValue([]);
    expect(renderToStaticMarkup(<UpcomingEventsCard footprint="1x1" />)).toContain("No scheduled events");
  });

  it("renders a large selectable calendar with selected event info below", () => {
    const markup = renderToStaticMarkup(<CalendarPlannerCard footprint="4x4" />);

    expect(markup).toContain("data-calendar-planner=\"4x4\"");
    expect(markup).toContain("data-selected-event=\"ops-review\"");
    expect(markup).toContain("Review route health and cargo exceptions.");
    expect(markup).toContain("Command deck");
  });
});
