import AppRouteModal from "../../../../components/AppRouteModal";
import NewAppointmentContent from "../../../../components/NewAppointmentContent";

export default function NewAppointmentModalPage() {
  return (
    <AppRouteModal eyebrow="Wizyty" title="Dodaj nową wizytę">
      <NewAppointmentContent presentation="modal" />
    </AppRouteModal>
  );
}
