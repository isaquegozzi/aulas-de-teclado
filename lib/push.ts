import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
  subject: process.env.VAPID_SUBJECT || "mailto:contato@aulas.com",
};

function ensureVapidDetails() {
  if (vapidKeys.publicKey && vapidKeys.privateKey) {
    webpush.setVapidDetails(vapidKeys.subject, vapidKeys.publicKey, vapidKeys.privateKey);
    return true;
  }
  return false;
}

export const VAPID_PUBLIC_KEY = vapidKeys.publicKey;
const VAPID_CONFIGURED = ensureVapidDetails();

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

export async function sendPushToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  if (!VAPID_CONFIGURED) return { ok: false as const, stale: false as const, code: 500 };
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 }
    );
    return { ok: true as const };
  } catch (err: unknown) {
    const code = (err as { statusCode?: number })?.statusCode;
    if (code === 404 || code === 410) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
      return { ok: false as const, stale: true as const, code };
    }
    return { ok: false as const, stale: false as const, code: code ?? 500 };
  }
}

export async function sendPushToStudent(
  studentId: string,
  payload: PushPayload
) {
  const subs = await prisma.pushSubscription.findMany({ where: { studentId } });
  const results = await Promise.all(
    subs.map((s) => sendPushToSubscription(s, payload))
  );
  return { sent: results.filter((r) => r.ok).length, total: subs.length };
}