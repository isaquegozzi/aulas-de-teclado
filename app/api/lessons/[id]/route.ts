import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: { student: true, payments: true },
  });
  if (!lesson) return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 });
  return NextResponse.json(lesson);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const lesson = await prisma.lesson.update({
    where: { id: params.id },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      durationMin: body.durationMin != null ? Number(body.durationMin) : undefined,
      topic: body.topic !== undefined ? body.topic?.trim() || null : undefined,
      material: body.material !== undefined ? body.material?.trim() || null : undefined,
      status: body.status !== undefined ? body.status : undefined,
      value: body.value != null ? Number(body.value) : undefined,
      paid: body.paid !== undefined ? Boolean(body.paid) : undefined,
      isMakeUp: body.isMakeUp !== undefined ? Boolean(body.isMakeUp) : undefined,
      notes: body.notes !== undefined ? body.notes?.trim() || null : undefined,
    },
    include: { student: true },
  });
  return NextResponse.json(lesson);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await prisma.lesson.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}