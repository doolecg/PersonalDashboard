import { NewsFeedPanel } from "./NewsFeedPanel";
import { useScienceNews } from "./useNewsSummary";

export function ScienceNewsCard() {
  const { data, loading } = useScienceNews();

  return (
    <NewsFeedPanel
      title="Science"
      summary={data?.summary ?? ""}
      headlines={data?.headlines ?? []}
      loading={loading}
    />
  );
}
