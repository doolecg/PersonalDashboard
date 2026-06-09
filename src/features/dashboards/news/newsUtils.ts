import type { NewsTickerItem } from "@/types/models";

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickDiverse(items: NewsTickerItem[], count: number): NewsTickerItem[] {
  const groups = new Map<string, NewsTickerItem[]>();
  for (const item of shuffle(items)) {
    const list = groups.get(item.source);
    if (list) list.push(item);
    else groups.set(item.source, [item]);
  }
  const sources = shuffle([...groups.keys()]);
  const result: NewsTickerItem[] = [];
  for (let depth = 0; result.length < count; depth++) {
    let advanced = false;
    for (const source of sources) {
      const item = groups.get(source)?.[depth];
      if (item) {
        result.push(item);
        advanced = true;
        if (result.length >= count) break;
      }
    }
    if (!advanced) break;
  }
  return shuffle(result);
}
