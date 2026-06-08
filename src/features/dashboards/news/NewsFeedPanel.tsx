import { cn } from "@/lib/utils";

export interface NewsFeedPanelProps {
  title: string;
  summary: string;
  headlines: Array<{ source: string; title: string; url?: string }>;
  loading: boolean;
}

export function NewsFeedPanel({ title, summary, headlines, loading }: NewsFeedPanelProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div>
        <h3 className="text-sm font-medium text-white/80">{title}</h3>
      </div>

      <div className="min-h-20 text-sm leading-relaxed text-white/70">
        {loading ? (
          <div className="space-y-1 opacity-50">
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-4/5 rounded bg-white/10" />
          </div>
        ) : (
          <p>{summary}</p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-1 opacity-50">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 w-full rounded bg-white/10" />
              ))}
            </div>
          ) : (
            headlines.map((item, idx) => (
              <div key={idx} className="border-l border-white/10 pl-2 text-xs">
                <div className="font-medium text-white/60">{item.source}</div>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">
                    {item.title}
                  </a>
                ) : (
                  <div className="text-white/70">{item.title}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
