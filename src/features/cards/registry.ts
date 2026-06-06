import type { CardDefinition } from "./types";
import { ExampleCard } from "./example/ExampleCard";

export const cardRegistry: CardDefinition[] = [
  {
    id: "example",
    title: "Base Card",
    description: "Reference card structure.",
    size: "md",
    Component: ExampleCard
  }
];
