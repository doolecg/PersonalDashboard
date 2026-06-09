import { Telescope } from "lucide-react";
import { useScienceNews } from "./useNewsSummary";
import { NewsCard } from "./NewsCard";

export function ScienceNewsCard() {
  const { data, loading } = useScienceNews();
  return (
    <NewsCard
      icon={<Telescope size={14} />}
      title="Science &amp; Space"
      endpoint="/api/ai/science-summary"
      data={data}
      loading={loading}
    />
  );
}
