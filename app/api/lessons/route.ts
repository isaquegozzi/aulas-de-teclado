import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay } from "@/lib/format";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const lessons = await prisma.lesson.findMany({
    where: {
      ...(from ? { date: { gte: startOfDay(new Date(from)) } } : {}),
      ...(to ? { date: { lte: endOfDay(new Date(to)) } } : {}),
    },
    orderBy: { date: "asc" },
    include: { student: true },
  });
  return NextResponse.json(lessons);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, date, durationMin, topic, material, status, value, isMakeUp, makeUpForId, notes } = body;

  if (!studentId || !date) {
    return NextResponse.json({ error: "Aluno e data são obrigatórios" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const lesson = await prisma.lesson.create({
    data: {
      studentId,
      date: new Date(date),
      durationMin: Number(durationMin) || 60,
      topic: topic?.trim() || null,
      material: material?.trim() || null,
      status: status || "AGENDADA",
      value: value != null ? Number(value) : student.lessonValue,
      isMakeUp: Boolean(isMakeUp),
      makeUpForId: makeUpForId || null,
      notes: notes?.trim() || null,
    },
    include: { student: true },
  });
  return NextResponse.json(lesson, { status: 201 });
}