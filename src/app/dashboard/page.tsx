import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { AnalysisRecord, AnalysisResult } from "@/lib/analysis";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);
  const [usage, analyses] = await Promise.all([
    prisma.dailyUsage.findUnique({
      where: { userId_usageDate: { userId: session.userId, usageDate: today } },
    }),
    prisma.analysis.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const history: AnalysisRecord[] = analyses.map((item) => ({
    id: item.id,
    taskType: item.taskType as AnalysisRecord["taskType"],
    prompt: item.prompt,
    revisionMode: item.revisionMode as AnalysisRecord["revisionMode"],
    originalText: item.originalText,
    createdAt: item.createdAt.toISOString(),
    result: JSON.parse(item.resultJson) as AnalysisResult,
  }));

  return (
    <Dashboard
      email={session.email}
      initialHistory={history}
      initialRemaining={Math.max(0, 5 - (usage?.count ?? 0))}
    />
  );
}
