import { useEffect, useState } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { getTldr, type TldrTopic } from "@/app/apiClient";
import { AiSkeleton } from "../planner/AiSkeleton";
import { Card } from "../planner/ui";

const NLM_URL = "https://notebooklm.google.com/";

function TopicSection({ topic }: { topic: TldrTopic }) {
  return (
    <div className="nlm-section">
      <span className="nlm-label">{topic.label}</span>
      <div className="nlm-chips">
        {topic.suggestions.map((s) => (
          <a
            key={s}
            className="nlm-chip"
            href={`${NLM_URL}?q=${encodeURIComponent(s)}`}
            target="_blank"
            rel="noreferrer"
            title={`Research in NotebookLM: ${s}`}
          >
            {s}
          </a>
        ))}
      </div>
    </div>
  );
}

export function TldrCoverageCard() {
  const [topics, setTopics] = useState<TldrTopic[] | null>(null);
  const [spinKey, setSpinKey] = useState(0);

  function load(force = false) {
    getTldr(force)
      .then((result) => setTopics(result.topics))
      .catch(() => setTopics([]));
  }

  useEffect(() => { load(); }, []);

  function handleRefresh() {
    setSpinKey((k) => k + 1);
    setTopics(null);
    load(true);
  }

  return (
    <Card className="fill">
      <div className="ai-head">
        <span className="ai-orb"><BookOpen size={16} /></span>
        <span className="ai-title">NotebookLM Topics</span>
        <span className="ai-badge">AI</span>
        <button
          className="icon-btn"
          style={{ width: 28, height: 28, background: "rgba(255,255,255,0.1)" }}
          aria-label="Refresh topics"
          onClick={handleRefresh}
        >
          <RefreshCw size={14} key={spinKey} className="spinning" />
        </button>
      </div>

      <div style={{ overflowY: "auto", minHeight: 0, flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {topics === null ? (
          <AiSkeleton widths={[80, 92, 75, 88]} />
        ) : topics.length === 0 ? (
          <p className="muted">Topics unavailable right now.</p>
        ) : (
          topics.map((topic) => <TopicSection key={topic.label} topic={topic} />)
        )}
      </div>
    </Card>
  );
}
