import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      lessons: {
        orderBy: { date: "desc" },
        include: { payments: true },
      },
      makeUpCredits: { orderBy: { createdAt: "desc" } },
      pushSubs: true,
    },
  });
  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const { name, phone, email, level, lessonValue, color, notes, active } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const student = await prisma.student.update({
    where: { id: params.id },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      level: level || "INICIANTE",
      lessonValue: Number(lessonValue) || 0,
      color: color || null,
      notes: notes?.trim() || null,
      active: typeof active === "boolean" ? active : undefined,
    },
  });
  return NextResponse.json(student);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await prisma.student.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}