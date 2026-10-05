"use client";

import { useCallback, useEffect, useState } from "react";
import { usePushSubscription } from "@/lib/use-push";

type Student = { id: string; name: string; color: string | null };
type Sub = { id: string; endpoint: string; userAgent: string | null; createdAt: string; student: Student | null };

export default function ConfigClient() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const { supported, enabled, enable, disable, error } = usePushSubscription();

  const load = useCallback(async () => {
    const subsRes = await fetch("/api/push/subs");
    setSubs(await subsRes.json());
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Notificações</h1>
        <p className="mt-1 text-sm text-gray-500">Lembretes automáticos por push (Web Push + VAPID) enviados 1 dia antes de cada aula</p>
      </div>

      <div className="card p-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Seu dispositivo</h2>
        {!supported ? (
          <p className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
            Seu navegador não suporta notificações push. Use Chrome, Edge, Firefox ou Safari (16.4+).
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={enabled ? disable : enable} className={enabled ? "stripe-btn-secondary" : "stripe-btn-primary"}>
              {enabled ? "Desativar neste dispositivo" : "Ativar neste dispositivo"}
            </button>
            <span className="text-sm" style={{ color: enabled ? "#059669" : "#9ca3af" }}>
              {enabled ? "✓ Notificações ativas" : "Sem notificações neste dispositivo"}
            </span>
            {error && <p className="w-full text-sm text-red-600">{error}</p>}
          </div>
        )}
        <p className="mt-4 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#eef2ff", color: "#4f46e5" }}>
          O cron diário (Vercel Cron) envia lembretes às 09:00 para todas as aulas do dia seguinte.
          Cada aluno também pode ativar notificações no seu perfil para receber no próprio dispositivo.
        </p>
      </div>

      <div className="card hidden overflow-hidden md:block">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Dispositivos inscritos ({subs.length})</h2>
        </div>
        {subs.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-400">Nenhum dispositivo inscrito ainda</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Aluno vinculado</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Navegador</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Inscrito em</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subs.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    {s.student ? (
                      <span className="flex items-center gap-2 font-medium">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.student.color || "#635bff" }} />
                        {s.student.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">Professor (geral)</span>
                    )}
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-xs text-gray-500">{s.userAgent || "—"}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-xs text-gray-400">{s.endpoint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="space-y-3 md:hidden">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-900">Dispositivos inscritos ({subs.length})</h2>
        </div>
        {subs.length === 0 ? (
          <p className="card px-4 py-8 text-center text-sm text-gray-400">Nenhum dispositivo inscrito ainda</p>
        ) : (
          subs.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                {s.student ? (
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.student.color || "#635bff" }} />
                    <span className="truncate">{s.student.name}</span>
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Professor (geral)</span>
                )}
                <span className="shrink-0 text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <p className="mt-1 truncate text-xs text-gray-400">{s.userAgent || "—"}</p>
              <p className="mt-0.5 truncate text-[11px] text-gray-300">{s.endpoint}</p>
            </div>
          ))
        )}
      </div>

      <div className="card p-6">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Vincular dispositivo a um aluno</h2>
        <p className="mb-2 text-sm text-gray-500">
          Se você ativou as notificações e quer que um aluno específico receba os lembretes no
          dispositivo dele, acesse o perfil do aluno (Alunos → clique no nome) e ative as
          notificações por lá.
        </p>
        <p className="text-xs text-gray-400">
          Dica: para o aluno receber no celular, ele deve abrir o site no celular, adicionar à
          tela inicial (PWA) e ativar as notificações no próprio perfil.
        </p>
      </div>
    </div>
  );
}