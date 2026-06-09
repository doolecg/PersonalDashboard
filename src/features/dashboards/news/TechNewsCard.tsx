import { Cpu } from "lucide-react";
import { useTechNews } from "./useNewsSummary";
import { NewsCard } from "./NewsCard";

export function TechNewsCard() {
  const { data, loading } = useTechNews();
  return (
    <NewsCard
      icon={<Cpu size={14} />}
      title="Tech"
      endpoint="/api/ai/tech-summary"
      data={data}
      loading={loading}
    />
  );
}
