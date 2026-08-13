import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, monthKey } from "@/lib/format";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // YYYY-MM
  const now = new Date();
  const today = startOfDay(now);

  const monthStart = month
    ? new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

  const [totalStudents, activeStudents, upcomingLessons, todayLessons, monthLessons] =
    await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { active: true } }),
      prisma.lesson.findMany({
        where: { status: { in: ["AGENDADA", "REPOSICAO"] }, date: { gte: today } },
        orderBy: { date: "asc" },
        take: 5,
        include: { student: true },
      }),
      prisma.lesson.findMany({
        where: { date: { gte: today, lte: endOfDay(now) }, status: { in: ["AGENDADA", "REPOSICAO", "CONCLUIDA"] } },
        orderBy: { date: "asc" },
        include: { student: true },
      }),
      prisma.lesson.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
        include: { student: true },
      }),
    ]);

  const monthlyRevenue = monthLessons
    .filter((l) => l.paid)
    .reduce((acc, l) => acc + l.value, 0);

  const monthlyPending = monthLessons
    .filter((l) => !l.paid && l.status !== "CANCELADA" && l.status !== "FALTA")
    .reduce((acc, l) => acc + l.value, 0);

  const outstandingCredits = await prisma.makeUpCredit.count({
    where: { used: false, student: { active: true } },
  });

  return NextResponse.json({
    totalStudents,
    activeStudents,
    upcomingLessons,
    todayLessons,
    monthlyRevenue,
    monthlyPending,
    outstandingCredits,
    monthLabel: monthKey(monthStart),
  });
}