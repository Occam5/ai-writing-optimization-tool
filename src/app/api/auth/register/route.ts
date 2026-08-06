import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await hash(parsed.data.password, 12),
    },
  });
  await createSession({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true }, { status: 201 });
}
