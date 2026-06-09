import { Newspaper } from "lucide-react";
import { useGlobalNews } from "./useNewsSummary";
import { NewsCard } from "./NewsCard";

export function GlobalNewsCard() {
  const { data, loading } = useGlobalNews();
  return (
    <NewsCard
      icon={<Newspaper size={14} />}
      title="Top Stories"
      endpoint="/api/ai/news-summary"
      data={data}
      loading={loading}
    />
  );
}
