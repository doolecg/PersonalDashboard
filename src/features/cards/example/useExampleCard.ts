import { useMemo } from "react";

export function useExampleCard() {
  return useMemo(
    () => ({
      primary: "Ready",
      detail: "Card logic lives beside the card UI.",
      items: ["Create a folder", "Add a hook", "Register the card"]
    }),
    []
  );
}
