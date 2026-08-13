import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { student: true },
    take: 200,
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, lessonId, amount, status, method, notes } = body;

  if (!studentId || amount == null) {
    return NextResponse.json({ error: "Aluno e valor são obrigatórios" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      studentId,
      lessonId: lessonId || null,
      amount: Number(amount),
      status: status || "PAGO",
      method: method?.trim() || null,
      notes: notes?.trim() || null,
      paidAt: status === "PAGO" ? new Date() : null,
    },
    include: { student: true },
  });

  if (lessonId) {
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { paid: status === "PAGO" },
    });
  }

  return NextResponse.json(payment, { status: 201 });
}