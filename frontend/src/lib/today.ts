import { useSyncExternalStore } from "react";

// Local YYYY-MM-DD (toISOString alone would give the UTC date).
export const localToday = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const subscribe = () => () => {};

// "" during SSR/prerender, the browser's local date after hydration.
export const useToday = () => useSyncExternalStore(subscribe, localToday, () => "");
