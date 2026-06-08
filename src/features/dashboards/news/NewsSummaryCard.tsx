import { useMemo } from "react";
import { Newspaper } from "lucide-react";
import { AiSkeleton } from "../planner/AiSkeleton";
import { Card } from "../planner/ui";
import { useGlobalNews, useTechNews, useScienceNews } from "./useNewsSummary";
import type { NewsSummary } from "./useNewsSummary";
import type { NewsTickerItem } from "@/types/models";

// Picks `count` articles from diverse sources, then shuffles the selection so
// each reload presents a different mix of sources in a random order.
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickDiverse(items: NewsTickerItem[], count: number): NewsTickerItem[] {
  const groups = new Map<string, NewsTickerItem[]>();
  for (const item of shuffle(items)) {
    const list = groups.get(item.source);
    if (list) list.push(item);
    else groups.set(item.source, [item]);
  }
  const sources = shuffle([...groups.keys()]);
  const result: NewsTickerItem[] = [];
  for (let depth = 0; result.length < count; depth += 1) {
    let advanced = false;
    for (const source of sources) {
      const item = groups.get(source)?.[depth];
      if (item) {
        result.push(item);
        advanced = true;
        if (result.length >= count) break;
      }
    }
    if (!advanced) break;
  }
  return shuffle(result);
}

function Section({
  label,
  state,
  count
}: {
  label: string;
  state: { data: NewsSummary | null; loading: boolean };
  count: number;
}) {
  const { data, loading } = state;
  const headlines = useMemo(() => pickDiverse(data?.headlines ?? [], count), [data, count]);

  return (
    <div className="news-section">
      <div className="weather-section-label">{label}</div>
      {loading && !data ? (
        <AiSkeleton widths={[100, 90, 80]} />
      ) : (
        <div className="news-headlines">
          {headlines.map((item, index) => (
            <a
              key={`${item.url}-${index}`}
              className="news-headline"
              href={item.url || undefined}
              target={item.url ? "_blank" : undefined}
              rel="noreferrer"
            >
              {item.image ? (
                <span className="news-thumb" style={{ backgroundImage: `url(${item.image})` }} aria-hidden />
              ) : (
                <span className="news-thumb news-thumb-empty" aria-hidden>
                  <Newspaper size={15} />
                </span>
              )}
              <span className="news-headline-text">
                <span className="news-src">{item.source}</span>
                <span className="news-txt">{item.title}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function NewsSummaryCard() {
  const global = useGlobalNews();
  const tech = useTechNews();
  const science = useScienceNews();

  return (
    <Card className="fill">
      <div className="ai-head">
        <span className="ai-orb">
          <Newspaper size={16} />
        </span>
        <span className="ai-title">News</span>
        <span className="ai-badge">AI</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", minHeight: 0 }}>
        <Section label="Top Stories" state={global} count={6} />
        <Section label="Tech" state={tech} count={4} />
        <Section label="Science" state={science} count={4} />
      </div>
    </Card>
  );
}
