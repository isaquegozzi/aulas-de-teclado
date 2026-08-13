import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay } from "@/lib/format";

export async function GET() {
  const today = startOfDay(new Date());
  const windowEnd = addDays(today, 14);

  const credits = await prisma.makeUpCredit.findMany({
    where: { used: false, student: { active: true } },
    orderBy: { createdAt: "asc" },
    include: { student: true },
  });

  const pendingLessons = await prisma.lesson.findMany({
    where: {
      status: "AGENDADA",
      date: { gte: today, lte: windowEnd },
    },
    orderBy: { date: "asc" },
    include: { student: true },
  });

  return NextResponse.json({ credits, pendingLessons });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, reason, lessonId } = body;

  if (!studentId || !reason?.trim()) {
    return NextResponse.json({ error: "Aluno e motivo são obrigatórios" }, { status: 400 });
  }

  const credit = await prisma.makeUpCredit.create({
    data: {
      studentId,
      reason: reason.trim(),
      lessonId: lessonId || null,
    },
    include: { student: true },
  });
  return NextResponse.json(credit, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id } = body as { id?: string };
  if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

  const credit = await prisma.makeUpCredit.update({
    where: { id },
    data: { used: true, usedAt: new Date() },
  });
  return NextResponse.json(credit);
}