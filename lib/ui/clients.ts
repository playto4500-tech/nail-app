import type { ClientClassification } from "../data/clients";

export function getClientClassificationLabel(classification: ClientClassification) {
  if (classification === "family") {
    return "Rodzina";
  }

  if (classification === "regular") {
    return "Stała klientka";
  }

  if (classification === "sporadic") {
    return "Sporadyczna klientka";
  }

  if (classification === "returning") {
    return "Zawsze wracają";
  }

  return "Nowa klientka";
}

export function getClientClassificationClasses(classification: ClientClassification) {
  if (classification === "family") {
    return "bg-orange-100 text-orange-700";
  }

  if (classification === "regular") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (classification === "sporadic") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (classification === "returning") {
    return "bg-red-100 text-red-700";
  }

  return "bg-blue-100 text-blue-700";
}
