"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  APP_ACCESS_COOKIE_NAME,
  appAccessCookieOptions,
  createAppAccessToken,
  getAppAccessPassword,
  isAppAccessConfigured,
} from "../../lib/auth/access";
import { actionError, type ActionResult } from "../../lib/actions/results";

export async function unlockAppAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/appointments");
  const configuredPassword = getAppAccessPassword();

  if (!isAppAccessConfigured()) {
    return actionError("Brakuje hasła aplikacji w konfiguracji.");
  }

  if (password !== configuredPassword) {
    return actionError("Nieprawidłowe hasło.");
  }

  const cookieStore = await cookies();
  cookieStore.set(
    APP_ACCESS_COOKIE_NAME,
    await createAppAccessToken(configuredPassword),
    appAccessCookieOptions,
  );

  redirect(nextPath.startsWith("/") ? nextPath : "/appointments");
}
