import { NewsFeedPanel } from "./NewsFeedPanel";
import { useGlobalNews } from "./useNewsSummary";

export function GlobalNewsCard() {
  const { data, loading } = useGlobalNews();

  return (
    <NewsFeedPanel
      title="Global"
      summary={data?.summary ?? ""}
      headlines={data?.headlines ?? []}
      loading={loading}
    />
  );
}
