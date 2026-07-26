const BUSINESS_TIME_ZONE = "Europe/Brussels";

export function getTodayDateKey(now = new Date()) {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
  }).formatToParts(now);
  const year = dateParts.find((part) => part.type === "year")?.value ?? "";
  const month = dateParts.find((part) => part.type === "month")?.value ?? "";
  const day = dateParts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

export function normalizeTime(time: string) {
  return time.slice(0, 5);
}

export function getQuarterHourTimeOptions(currentTime?: string) {
  const timeOptions: string[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      timeOptions.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      );
    }
  }

  const normalizedCurrentTime = currentTime ? normalizeTime(currentTime) : "";

  if (normalizedCurrentTime && !timeOptions.includes(normalizedCurrentTime)) {
    return [...timeOptions, normalizedCurrentTime].sort();
  }

  return timeOptions;
}
