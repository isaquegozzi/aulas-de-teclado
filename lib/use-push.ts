"use client";

import { useEffect, useState } from "react";
import { VAPID_PUBLIC_KEY } from "@/lib/push-client-const";

declare global {
  interface Window {
    PushManager: typeof PushManager;
  }
}

export function usePushSubscription(studentId?: string) {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!cancelled && reg) {
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setEnabled(Boolean(sub));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function getRegistration() {
    return navigator.serviceWorker.getRegistration();
  }

  async function syncState() {
    const reg = await getRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    setEnabled(Boolean(sub));
  }

  async function enable() {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Permissão de notificação negada.");
        return false;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        });
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          studentId,
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar inscrição");
      setEnabled(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao ativar notificações");
      return false;
    }
  }

  async function disable() {
    setError(null);
    try {
      const reg = await getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch("/api/push/unsubscribe", { method: "POST" });
      setEnabled(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao desativar notificações");
      return false;
    }
  }

  return { supported, enabled, enable, disable, error, refresh: syncState };
}