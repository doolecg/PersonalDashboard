import type { ComponentType } from "react";

export type CardFootprint = "1x1" | "2x1" | "2x2" | "1x2" | "4x2";

export type CardDefinition = {
  id: string;
  title: string;
  description?: string;
  footprint: CardFootprint;
  Component: ComponentType;
};
