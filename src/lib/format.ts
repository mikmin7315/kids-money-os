const number = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

export function formatWon(value: number) {
  return number.format(value) + "원";
}

export function formatWonParts(value: number) {
  return { amount: number.format(value), unit: "원" };
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(date));
}
