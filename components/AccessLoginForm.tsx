"use client";

import { useActionState } from "react";
import { unlockAppAction } from "../app/actions/access";
import type { ActionResult } from "../lib/actions/results";

type Props = {
  nextPath: string;
};

const initialState: ActionResult = { ok: true };

export default function AccessLoginForm({ nextPath }: Props) {
  const [state, formAction, isPending] = useActionState(
    unlockAppAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Hasło</span>
        <input
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
        />
      </label>

      {!state.ok && state.error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
      >
        {isPending ? "Sprawdzanie..." : "Wejdź do aplikacji"}
      </button>
    </form>
  );
}
