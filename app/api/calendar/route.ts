import { getAppointments } from "../../../lib/data/appointments";
import {
  buildCalendarFeed,
  getCalendarFeedToken,
  isCalendarFeedConfigured,
} from "../../../lib/calendar/feed";

export async function GET(request: Request) {
  if (!isCalendarFeedConfigured()) {
    return new Response("Calendar feed is not configured.", {
      status: 503,
    });
  }

  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token") ?? "";

  if (!token || token !== getCalendarFeedToken()) {
    return new Response("Unauthorized calendar feed request.", {
      status: 401,
    });
  }

  const appointments = await getAppointments();
  const ics = buildCalendarFeed(appointments);

  return new Response(ics, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": 'inline; filename="nail-planner.ics"',
      "Content-Type": "text/calendar; charset=utf-8",
    },
  });
}
