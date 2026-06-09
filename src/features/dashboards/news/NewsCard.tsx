import { useState, useMemo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import type { NewsSummary } from "./useNewsSummary";
import { getOrRefreshStore } from "./useNewsSummary";
import { AiSkeleton } from "../planner/AiSkeleton";
import { Card } from "../planner/ui";
import { pickDiverse } from "./newsUtils";

type Props = {
  icon: ReactNode;
  title: string;
  endpoint: string;
  data: NewsSummary | null;
  loading: boolean;
};

export function NewsCard({ icon, title, endpoint, data, loading }: Props) {
  const [spinKey, setSpinKey] = useState(0);
  const headlines = useMemo(() => pickDiverse(data?.headlines ?? [], 8), [data]);

  return (
    <Card className="fill">
      <div className="ai-head">
        <span className="ai-orb">{icon}</span>
        <span className="ai-title">{title}</span>
        <span className="ai-badge">AI</span>
        <button
          className="icon-btn"
          style={{ width: 28, height: 28, background: "rgba(255,255,255,0.1)" }}
          aria-label="Refresh"
          onClick={() => {
            setSpinKey((k) => k + 1);
            getOrRefreshStore(endpoint).refresh(true);
          }}
        >
          <RefreshCw size={13} key={spinKey} className="spinning" />
        </button>
      </div>
      <div className="news-headlines" style={{ overflowY: "auto", minHeight: 0, flex: 1 }}>
        {loading && !data ? (
          <AiSkeleton widths={[100, 90, 80, 95]} />
        ) : (
          headlines.map((item, i) => (
            <a
              key={`${item.url}-${i}`}
              className="news-headline"
              href={item.url || undefined}
              target={item.url ? "_blank" : undefined}
              rel="noreferrer"
            >
              {item.image ? (
                <span className="news-thumb" style={{ backgroundImage: `url(${item.image})` }} aria-hidden />
              ) : (
                <span className="news-thumb news-thumb-empty">{icon}</span>
              )}
              <span className="news-headline-text">
                <span className="news-src">{item.source}</span>
                <span className="news-txt">{item.title}</span>
              </span>
            </a>
          ))
        )}
      </div>
    </Card>
  );
}
