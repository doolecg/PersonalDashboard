import { Button } from "@/components/ui/button";
import { DashboardCard } from "../DashboardCard";
import { useExampleCard } from "./useExampleCard";

export function ExampleCard() {
  const card = useExampleCard();

  return (
    <DashboardCard title="Base Card" description={card.detail}>
      <div className="flex flex-col gap-4">
        <strong className="text-3xl font-semibold tracking-tight">{card.primary}</strong>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {card.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Button className="self-start" size="sm">
          Action
        </Button>
      </div>
    </DashboardCard>
  );
}
