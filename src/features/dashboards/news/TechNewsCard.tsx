import { NewsFeedPanel } from "./NewsFeedPanel";
import { useTechNews } from "./useNewsSummary";

export function TechNewsCard() {
  const { data, loading } = useTechNews();

  return (
    <NewsFeedPanel
      title="Tech"
      summary={data?.summary ?? ""}
      headlines={data?.headlines ?? []}
      loading={loading}
    />
  );
}
