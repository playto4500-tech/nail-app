export function getTodayDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
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
