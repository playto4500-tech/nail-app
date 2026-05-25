import Link from "next/link";
import NewAppointmentForm from "./NewAppointmentForm";
import { getAppointments } from "../lib/data/appointments";
import { getClientSummaries } from "../lib/data/clients";

type Props = {
  presentation?: "modal" | "page";
};

export default async function NewAppointmentContent({
  presentation = "page",
}: Props) {
  const [clients, appointments] = await Promise.all([
    getClientSummaries(),
    getAppointments(),
  ]);

  return (
    <>
      <NewAppointmentForm
        clients={clients}
        appointments={appointments}
        presentation={presentation}
      />

      {presentation === "page" && clients.length === 0 ? (
        <section className="rounded-[24px] border border-dashed border-slate-200 bg-white p-5 shadow-sm shadow-slate-200">
          <p className="text-sm text-slate-600">
            Nie masz jeszcze żadnej klientki w bazie, więc formularz domyślnie przełącza
            się na tryb nowej klientki.
          </p>
          <Link
            href="/clients"
            className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            Przejdź do klientek
          </Link>
        </section>
      ) : null}
    </>
  );
}
