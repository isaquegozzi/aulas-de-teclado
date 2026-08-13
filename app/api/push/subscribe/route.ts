import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, studentId } = body as {
      subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      studentId?: string;
    };

    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: "subscription inválida" }, { status: 400 });
    }

    let student = null;
    if (studentId) {
      student = await prisma.student.findUnique({ where: { id: studentId } });
    }

    const data = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: req.headers.get("user-agent")?.slice(0, 255) ?? null,
      studentId: student?.id ?? null,
    };

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: data,
      update: { ...data, lastUsed: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "erro interno" }, { status: 500 });
  }
}