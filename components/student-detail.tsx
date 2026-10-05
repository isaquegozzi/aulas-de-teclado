"use client";

import { useCallback, useEffect, useState } from "react";
import { usePushSubscription } from "@/lib/use-push";
import { formatBRL, formatDateTime, formatDate } from "@/lib/format";

type Lesson = {
  id: string;
  date: string;
  durationMin: number;
  topic: string | null;
  material: string | null;
  status: string;
  value: number;
  paid: boolean;
  isMakeUp: boolean;
  notes: string | null;
};

type MakeUpCredit = { id: string; reason: string; used: boolean; createdAt: string };
type PushSub = { id: string; endpoint: string; createdAt: string };

type StudentData = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  level: string;
  lessonValue: number;
  color: string | null;
  active: boolean;
  notes: string | null;
  lessons: Lesson[];
  makeUpCredits: MakeUpCredit[];
  pushSubs: PushSub[];
};

type Props = {
  studentId: string;
  onClose: () => void;
  onChanged: () => void;
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  AGENDADA: { label: "Agendada", color: "#4f46e5", bg: "#eef2ff" },
  REPOSICAO: { label: "Reposição", color: "#7c3aed", bg: "#f5f3ff" },
  CONCLUIDA: { label: "Concluída", color: "#059669", bg: "#ecfdf5" },
  CANCELADA: { label: "Cancelada", color: "#6b7280", bg: "#f3f4f6" },
  FALTA: { label: "Falta", color: "#dc2626", bg: "#fef2f2" },
};

export default function StudentDetail({ studentId, onClose, onChanged }: Props) {
  const [data, setData] = useState<StudentData | null>(null);
  const [creditReason, setCreditReason] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const { supported, enabled, enable, disable, error: pushError } = usePushSubscription(studentId);

  const load = useCallback(async () => {
    const res = await fetch(`/api/students/${studentId}`);
    if (res.ok) setData(await res.json());
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return null;

  const outstandingCredits = data.makeUpCredits.filter((c) => !c.used);
  const totalEarned = data.lessons.filter((l) => l.paid).reduce((a, l) => a + l.value, 0);
  const totalOwed = data.lessons
    .filter((l) => !l.paid && l.status !== "CANCELADA" && l.status !== "FALTA")
    .reduce((a, l) => a + l.value, 0);

  async function addCredit(e: React.FormEvent) {
    e.preventDefault();
    if (!creditReason.trim()) return;
    await fetch("/api/makeups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, reason: creditReason.trim() }),
    });
    setCreditReason("");
    void load();
    onChanged();
  }

  async function sendTest() {
    setTestResult(null);
    const res = await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, title: "Teste de notificação", body: testMsg || "Esta é uma notificação de teste" }),
    });
    const result = await res.json();
    setTestResult(`Enviadas: ${result.sent}/${result.total}`);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: data.color || "#635bff" }}
            >
              {data.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{data.name}</h2>
              <p className="text-xs text-gray-500">
                {data.phone || "sem telefone"} · {data.email || "sem email"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-4 text-center" style={{ borderColor: "#059669" }}>
              <p className="text-xs text-gray-500">Recebido</p>
              <p className="text-lg font-semibold" style={{ color: "#059669" }}>{formatBRL(totalEarned)}</p>
            </div>
            <div className="card p-4 text-center" style={{ borderColor: "#dc2626" }}>
              <p className="text-xs text-gray-500">A receber</p>
              <p className="text-lg font-semibold" style={{ color: "#dc2626" }}>{formatBRL(totalOwed)}</p>
            </div>
            <div className="card p-4 text-center" style={{ borderColor: "#7c3aed" }}>
              <p className="text-xs text-gray-500">Reposições</p>
              <p className="text-lg font-semibold" style={{ color: "#7c3aed" }}>{outstandingCredits.length}</p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Notificações push</h3>
            {!supported ? (
              <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
                Seu navegador não suporta notificações push.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button onClick={enabled ? disable : enable} className={enabled ? "stripe-btn-secondary" : "stripe-btn-primary"}>
                    {enabled ? "Desativar notificações" : "Ativar notificações"}
                  </button>
                  <span className="text-xs" style={{ color: enabled ? "#059669" : "#9ca3af" }}>
                    {enabled ? `${data.pushSubs.length} dispositivo(s)` : "Desativado"}
                  </span>
                </div>
                {pushError && <p className="text-sm text-red-600">{pushError}</p>}
                {enabled && (
                  <div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center">
                    <input type="text" value={testMsg} onChange={(e) => setTestMsg(e.target.value)} placeholder="Mensagem de teste..." className="stripe-input flex-1" />
                    <button onClick={sendTest} className="stripe-btn-secondary shrink-0">
                      Enviar teste
                    </button>
                    {testResult && <span className="text-xs text-gray-500">{testResult}</span>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Reposições pendentes</h3>
            {outstandingCredits.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-400">Nenhuma reposição pendente</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {outstandingCredits.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{c.reason}</span>
                    <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addCredit} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input type="text" value={creditReason} onChange={(e) => setCreditReason(e.target.value)} placeholder="Motivo da reposição..." className="stripe-input flex-1" />
              <button type="submit" className="stripe-btn-primary shrink-0">
                + Reposição
              </button>
            </form>
          </div>

          <div className="card hidden overflow-hidden md:block">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Histórico de aulas ({data.lessons.length})</h3>
            </div>
            {data.lessons.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Sem aulas registradas</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tópico</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Valor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.lessons.slice(0, 20).map((l) => {
                    const s = statusConfig[l.status] || statusConfig.AGENDADA;
                    return (
                      <tr key={l.id} className="hover:bg-gray-50/50">
                        <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{formatDate(l.date)}</td>
                        <td className="px-4 py-2.5">{l.topic || "—"}</td>
                        <td className="px-4 py-2.5 text-gray-500">{l.material || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className="badge" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">{formatBRL(l.value)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span style={{ color: l.paid ? "#059669" : "#d1d5db" }}>{l.paid ? "✓" : "—"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-2 md:hidden">
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-900">Histórico de aulas ({data.lessons.length})</h3>
            </div>
            {data.lessons.length === 0 ? (
              <p className="card px-4 py-8 text-center text-sm text-gray-400">Sem aulas registradas</p>
            ) : (
              data.lessons.slice(0, 20).map((l) => {
                const s = statusConfig[l.status] || statusConfig.AGENDADA;
                return (
                  <div key={l.id} className="card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">{formatDate(l.date)}</span>
                      <span className="badge" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-gray-900">{l.topic || "—"}</p>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
                      <span>{l.material || "Sem material"}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{formatBRL(l.value)}</span>
                        <span style={{ color: l.paid ? "#059669" : "#d1d5db" }}>{l.paid ? "✓" : "—"}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}