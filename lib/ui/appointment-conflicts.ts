import type { Appointment } from "../data/appointments";

function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

export function getAppointmentConflicts(input: {
  appointments: Appointment[];
  date: string;
  time: string;
  excludeAppointmentId?: number;
}) {
  const selectedMinutes = timeToMinutes(input.time);

  return input.appointments.filter((appointment) => {
    if (appointment.id === input.excludeAppointmentId) {
      return false;
    }

    if (appointment.status === "cancelled") {
      return false;
    }

    if (appointment.date !== input.date) {
      return false;
    }

    const appointmentMinutes = timeToMinutes(appointment.time);
    return Math.abs(appointmentMinutes - selectedMinutes) < 60;
  });
}

export function getAppointmentConflictMessage(conflicts: Appointment[], actionLabel: string) {
  if (conflicts.length === 0) {
    return null;
  }

  const sortedConflicts = [...conflicts].sort((first, second) =>
    first.time.localeCompare(second.time),
  );

  const conflictLines = sortedConflicts.map(
    (appointment) => `- ${appointment.clientName}, ${appointment.time}`,
  );

  return [
    "O tej godzinie jest już zapisana wizyta:",
    ...conflictLines,
    "",
    `Na pewno ${actionLabel} wizytę?`,
  ].join("\n");
}
