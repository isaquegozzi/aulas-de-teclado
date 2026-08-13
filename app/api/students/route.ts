import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const students = await prisma.student.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { lessons: true, makeUpCredits: true } },
    },
  });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, level, lessonValue, color, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const student = await prisma.student.create({
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      level: level || "INICIANTE",
      lessonValue: Number(lessonValue) || 0,
      color: color || null,
      notes: notes?.trim() || null,
    },
  });
  return NextResponse.json(student, { status: 201 });
}