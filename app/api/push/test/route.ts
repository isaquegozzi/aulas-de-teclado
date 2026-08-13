import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { sendPushToStudent } from "@/lib/push";

export async function POST(req: NextRequest) {
  const { studentId, title, body } = (await req.json()) as {
    studentId?: string;
    title?: string;
    body?: string;
  };

  if (!studentId) return NextResponse.json({ error: "studentId ausente" }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });

  const res = await sendPushToStudent(studentId, {
    title: title || `Notificação de ${student.name}`,
    body: body || "Teste de notificação.",
    url: "/",
  });

  return NextResponse.json(res);
}