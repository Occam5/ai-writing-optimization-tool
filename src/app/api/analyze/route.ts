import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateAnalysis } from "@/lib/gemini-analysis";

const inputSchema = z.object({
  taskType: z.enum(["task1", "task2"]),
  prompt: z.string().trim().max(1200),
  text: z.string().trim().min(50).max(10000),
  revisionMode: z.enum(["conservative", "polished"]),
  image: z.object({ data: z.string().max(7_000_000), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]) }).optional(),
}).refine((value) => value.prompt.length >= 10 || Boolean(value.image), { message: "Add a question or image." });

function utcDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Add the IELTS question and at least 50 characters of your response." },
      { status: 400 },
    );
  }

  const date = utcDate();
  const current = await prisma.dailyUsage.findUnique({
    where: { userId_usageDate: { userId: session.userId, usageDate: date } },
  });
  if ((current?.count ?? 0) >= 5) {
    return NextResponse.json({ error: "FREE_LIMIT_REACHED", remaining: 0 }, { status: 429 });
  }

  let result;
  try {
    result = await generateAnalysis(parsed.data);
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return NextResponse.json({ error: "The AI service is unavailable or not configured. Please try again." }, { status: 503 });
  }
  const [analysis, usage] = await prisma.$transaction([
    prisma.analysis.create({
      data: {
        userId: session.userId,
        taskType: parsed.data.taskType,
        prompt: parsed.data.prompt || "IELTS question supplied as an image",
        revisionMode: parsed.data.revisionMode,
        originalText: parsed.data.text,
        resultJson: JSON.stringify(result),
      },
    }),
    prisma.dailyUsage.upsert({
      where: { userId_usageDate: { userId: session.userId, usageDate: date } },
      update: { count: { increment: 1 } },
      create: { userId: session.userId, usageDate: date, count: 1 },
    }),
  ]);

  return NextResponse.json({
    analysis: {
      id: analysis.id,
      taskType: analysis.taskType,
      prompt: analysis.prompt,
      revisionMode: analysis.revisionMode,
      originalText: analysis.originalText,
      createdAt: analysis.createdAt.toISOString(),
      result,
    },
    remaining: Math.max(0, 5 - usage.count),
  });
}
