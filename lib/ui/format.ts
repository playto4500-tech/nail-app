export function formatPrice(price: number) {
  return `${price.toLocaleString("pl-PL")} zł`;
}

export function formatNumericDate(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}
