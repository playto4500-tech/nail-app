"use client";

import type { ServiceItem } from "../lib/data/services";

type Props = {
  services: ServiceItem[];
};

function formatPrice(price: number) {
  if (price <= 0) {
    return "Do ustalenia";
  }

  return `${price} zł`;
}

function getCategoryLabel(category: "service" | "addon") {
  return category === "service" ? "Usługa" : "Dodatek";
}

export default function ServicesExperience({ services }: Props) {
  return (
    <div className="space-y-3">
      {services.map((service) => (
        <article
          key={service.id}
          className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{getCategoryLabel(service.category)}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{service.name}</p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-slate-900">
              {formatPrice(service.price)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
