import type { Category } from "@expense/shared";

// One colour per category, used identically in the list and the summary.
// Colour is never the only carrier of meaning — the label always travels with it.
export const CATEGORY_COLOR: Record<Category, string> = {
  food: "var(--cat-food)",
  travel: "var(--cat-travel)",
  bills: "var(--cat-bills)",
  other: "var(--cat-other)",
};

export const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "2026-03-14" -> "14 Mar" without pulling the string through a timezone.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? m}`;
};
