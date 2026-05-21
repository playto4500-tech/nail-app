"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

const navigationItems = [
  { href: "/", label: "Pulpit" },
  { href: "/appointments", label: "Wizyty" },
  { href: "/clients", label: "Klientki" },
  { href: "/services", label: "Usługi" },
  { href: "/inventory", label: "Zasoby" },
  { href: "/planner", label: "Planner" },
  { href: "/money", label: "Pieniądze" },
];

const pageTitles: Record<string, string> = {
  "/": "Pulpit",
  "/appointments": "Wizyty",
  "/appointments/new": "Nowa wizyta",
  "/clients": "Klientki",
  "/services": "Usługi",
  "/inventory": "Zasoby",
  "/planner": "Planner",
  "/money": "Pieniądze",
};

export default function TopBar() {
  const pathname = usePathname();
  const menuToggleRef = useRef<HTMLInputElement>(null);

  const title = pageTitles[pathname] ?? "Nail Studio Manager";

  function isItemActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMenu() {
    if (menuToggleRef.current) {
      menuToggleRef.current.checked = false;
    }
  }

  return (
    <div className="relative">
      <input
        id="topbar-menu-toggle"
        ref={menuToggleRef}
        type="checkbox"
        className="peer hidden"
      />

      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
        <div className="mx-auto grid max-w-md grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3 px-4 py-3">
          <label
            htmlFor="topbar-menu-toggle"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-200 transition hover:bg-slate-100"
            aria-label="Otwórz menu nawigacji"
          >
            ☰
          </label>

          <div className="min-w-0 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
              Nail Studio Manager
            </p>
            <p className="text-base font-semibold text-slate-900">{title}</p>
          </div>

          <div className="h-10 w-10" />
        </div>
      </header>

      <div className="fixed inset-y-0 left-0 z-50 w-72 transform bg-white shadow-xl transition-transform duration-300 ease-in-out -translate-x-full peer-checked:translate-x-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">Menu</p>
          <label
            htmlFor="topbar-menu-toggle"
            className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
            aria-label="Zamknij menu"
          >
            ✕
          </label>
        </div>
        <nav className="space-y-2 p-4">
          {navigationItems.map((item) => {
            const isActive = isItemActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                aria-current={isActive ? "page" : undefined}
                className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm shadow-slate-300"
                    : "text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <label htmlFor="topbar-menu-toggle" className="fixed inset-0 z-40 hidden bg-slate-900/30 peer-checked:block" />
    </div>
  );
}
