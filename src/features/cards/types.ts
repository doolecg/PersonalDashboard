import type { ComponentType } from "react";

export type CardSize = "sm" | "md" | "lg" | "wide";

export type CardDefinition = {
  id: string;
  title: string;
  description?: string;
  size: CardSize;
  Component: ComponentType;
};
