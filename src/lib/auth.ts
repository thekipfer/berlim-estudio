import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/*
 * Single-admin login for /admin. Credentials come from environment variables
 * (ADMIN_EMAIL, ADMIN_PASSWORD, optional ADMIN_SECRET), never from the code.
 * The session is a signed cookie: "<expiry>.<hmac>". Server-only.
 */

const COOKIE = "berlim_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const { ADMIN_SECRET, ADMIN_EMAIL = "", ADMIN_PASSWORD = "" } = process.env;
  // Without ADMIN_SECRET, derive one from the credentials (changing the password logs everyone out).
  return ADMIN_SECRET || createHash("sha256").update(`berlim:${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).digest("hex");
}

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export const isConfigured = () => Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);

export function checkCredentials(email: string, password: string) {
  if (!isConfigured()) return false;
  const emailOk = safeEqual(email.trim().toLowerCase(), process.env.ADMIN_EMAIL!.trim().toLowerCase());
  const passwordOk = safeEqual(password, process.env.ADMIN_PASSWORD!);
  return emailOk && passwordOk;
}

export async function startSession() {
  const expires = Date.now() + MAX_AGE * 1000;
  const value = `${expires}.${sign(String(expires))}`;
  const jar = await cookies();
  const options = { secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: MAX_AGE };
  jar.set(COOKIE, value, { ...options, httpOnly: true });
  // Readable hint so the public pages know to load the in-page editor (the real check is COOKIE).
  jar.set(EDIT_HINT_COOKIE, "1", options);
}

export const EDIT_HINT_COOKIE = "berlim_edit";

export async function endSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(EDIT_HINT_COOKIE);
}

export async function isLoggedIn() {
  if (!isConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, mac] = value.split(".");
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  return safeEqual(mac, sign(expires));
}
