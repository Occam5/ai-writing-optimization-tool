import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "l2write_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "missing-auth-secret",
);

export type SessionPayload = {
  userId: string;
  email: string;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: String(payload.userId),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}
