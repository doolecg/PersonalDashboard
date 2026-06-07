import type { ComponentType } from "react";

export type CardFootprint = "1x1" | "2x1" | "2x2" | "1x2" | "4x2" | "4x4";

export type CardComponentProps = {
  footprint: CardFootprint;
};

export type PersistedCardLayout = {
  column: number;
  id: string;
  footprint: CardFootprint;
  order: number;
  row: number;
  visible?: boolean;
};

export type CardDefinition = {
  id: string;
  title: string;
  description?: string;
  footprint: CardFootprint;
  Component: ComponentType<CardComponentProps>;
};

export type RuntimeCardLayout = CardDefinition & PersistedCardLayout;
