export const APP_ACCESS_COOKIE_NAME = "nail_app_access";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 60;

export const appAccessCookieOptions = {
  httpOnly: true,
  maxAge: SESSION_TTL_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function getAppAccessPassword() {
  return process.env.APP_ACCESS_PASSWORD ?? "";
}

export function isAppAccessConfigured() {
  return getAppAccessPassword().length > 0;
}

export async function createAppAccessToken(password: string) {
  const input = new TextEncoder().encode(`nail-app-access:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", input);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
