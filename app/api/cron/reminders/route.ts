import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { sendPushToStudent } from "@/lib/push";
import { formatTime } from "@/lib/format";

export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const start = new Date(tomorrow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(tomorrow);
  end.setHours(23, 59, 59, 999);

  const lessons = await prisma.lesson.findMany({
    where: {
      status: { in: ["AGENDADA", "REPOSICAO"] },
      date: { gte: start, lte: end },
      student: { active: true },
    },
    include: { student: true },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const lesson of lessons) {
    const res = await sendPushToStudent(lesson.studentId, {
      title: `Lembrete de aula - ${lesson.student.name}`,
      body: `Você tem aula de teclado amanhã às ${formatTime(lesson.date)}.`,
      url: "/",
      tag: `aula-${lesson.id}`,
    });
    if (res.sent > 0) sent += res.sent;
    else if (res.total === 0) errors.push(`${lesson.student.name}: sem inscrição push`);
  }

  return NextResponse.json({
    ok: true,
    lessonsChecked: lessons.length,
    notificationsSent: sent,
    notes: errors.slice(0, 10),
  });
}