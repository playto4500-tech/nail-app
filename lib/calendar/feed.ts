import type { Appointment } from "../data/appointments";

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);

  return `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}00`;
}

function addHour(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + 60;
  const normalizedMinutes = totalMinutes % (24 * 60);
  const nextHours = Math.floor(normalizedMinutes / 60);
  const nextMinutes = normalizedMinutes % 60;

  return `${pad(nextHours)}:${pad(nextMinutes)}`;
}

function formatUtcStamp(date = new Date()) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function getTodayDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  return `${year}-${month}-${day}`;
}

function isUpcomingAppointment(appointment: Appointment, todayDateKey: string, nowTime: string) {
  if (appointment.status !== "confirmed" && appointment.status !== "scheduled") {
    return false;
  }

  if (appointment.date < todayDateKey) {
    return false;
  }

  if (appointment.date === todayDateKey && appointment.time.slice(0, 5) < nowTime) {
    return false;
  }

  return true;
}

function buildEventDescription(appointment: Appointment) {
  const lines = [
    `Klientka: ${appointment.clientName}`,
    appointment.clientInstagramHandle
      ? `Instagram: ${appointment.clientInstagramHandle}`
      : null,
    appointment.serviceName ? `Usługa: ${appointment.serviceName}` : null,
    appointment.addonNames.length > 0
      ? `Dodatki: ${appointment.addonNames.join(", ")}`
      : null,
    appointment.notes ? `Uwagi: ${appointment.notes}` : null,
  ].filter(Boolean);

  return escapeIcsText(lines.join("\n"));
}

function buildEventSummary(appointment: Appointment) {
  const baseTitle = appointment.serviceName
    ? `${appointment.clientName} - ${appointment.serviceName}`
    : appointment.clientName;

  return escapeIcsText(baseTitle);
}

export function getCalendarFeedToken() {
  return process.env.CALENDAR_FEED_TOKEN ?? "";
}

export function getCalendarFeedTimezone() {
  return process.env.CALENDAR_FEED_TIMEZONE ?? "Europe/Warsaw";
}

export function isCalendarFeedConfigured() {
  return getCalendarFeedToken().length > 0;
}

export function buildCalendarFeed(appointments: Appointment[]) {
  const now = new Date();
  const todayDateKey = getTodayDateKey(now);
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const timezone = getCalendarFeedTimezone();
  const dtstamp = formatUtcStamp(now);

  const events = appointments
    .filter((appointment) => isUpcomingAppointment(appointment, todayDateKey, nowTime))
    .sort((first, second) => {
      if (first.date === second.date) {
        return first.time.localeCompare(second.time);
      }

      return first.date.localeCompare(second.date);
    })
    .map((appointment) => {
      const start = formatDateTime(appointment.date, appointment.time);
      const end = formatDateTime(appointment.date, addHour(appointment.time));

      return [
        "BEGIN:VEVENT",
        `UID:appointment-${appointment.id}@nail-app`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;TZID=${timezone}:${start}`,
        `DTEND;TZID=${timezone}:${end}`,
        `SUMMARY:${buildEventSummary(appointment)}`,
        `DESCRIPTION:${buildEventDescription(appointment)}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
      ].join("\r\n");
    });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nail App//Planner Calendar//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText("Wizyty paznokcie")}`,
    `X-WR-TIMEZONE:${timezone}`,
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
