import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password?: string };

  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminHash) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD_HASH não configurado. Gere com: node scripts/hash-password.mjs" },
      { status: 500 }
    );
  }

  if (!password || !(await bcrypt.compare(password, adminHash))) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  return createSession({ name: "Professor", role: "professor" });
}