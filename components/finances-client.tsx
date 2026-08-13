"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatBRL, formatDate } from "@/lib/format";

type Student = { id: string; name: string; color: string | null; lessonValue: number };
type Lesson = { id: string; date: string; status: string; value: number; paid: boolean; student: Student };
type Summary = { totalStudents: number; activeStudents: number; monthlyRevenue: number; monthlyPending: number };

export default function FinancesClient() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const load = useCallback(async () => {
    const [lessonsRes, dashRes] = await Promise.all([fetch("/api/lessons"), fetch(`/api/dashboard?month=${month}`)]);
    setLessons(await lessonsRes.json());
    setSummary(await dashRes.json());
  }, [month]);

  useEffect(() => { void load(); }, [load]);

  const monthLessons = useMemo(
    () => lessons.filter((l) => l.date.startsWith(month)).filter((l) => l.status !== "CANCELADA" && l.status !== "FALTA").sort((a, b) => b.date.localeCompare(a.date)),
    [lessons, month]
  );

  const byStudent = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null; earned: number; owed: number; count: number }>();
    for (const l of monthLessons) {
      const entry = map.get(l.student.id) || { name: l.student.name, color: l.student.color, earned: 0, owed: 0, count: 0 };
      if (l.paid) entry.earned += l.value; else entry.owed += l.value;
      entry.count += 1;
      map.set(l.student.id, entry);
    }
    return [...map.entries()].sort((a, b) => b[1].owed - a[1].owed);
  }, [monthLessons]);

  async function togglePaid(lesson: Lesson) {
    await fetch(`/api/lessons/${lesson.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: !lesson.paid }) });
    void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Finanças</h1>
          <p className="mt-1 text-sm text-gray-500">Valores das aulas e controle de pagamento</p>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="stripe-input" style={{ width: "180px" }} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Recebido no mês</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: "#059669" }}>{formatBRL(summary?.monthlyRevenue ?? 0)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">A receber</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: "#dc2626" }}>{formatBRL(summary?.monthlyPending ?? 0)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Aulas no mês</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{monthLessons.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Aluno</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Valor</th>
                  <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthLessons.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">{formatDate(l.date)}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.student.color || "#635bff" }} />
                        {l.student.name}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="badge" style={{ backgroundColor: l.status === "CONCLUIDA" ? "#ecfdf5" : "#eef2ff", color: l.status === "CONCLUIDA" ? "#059669" : "#4f46e5" }}>
                        {l.status === "CONCLUIDA" ? "Concluída" : "Agendada"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-gray-900">{formatBRL(l.value)}</td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => togglePaid(l)} className="stripe-btn-secondary text-xs" style={{ color: l.paid ? "#059669" : "#6b7280", backgroundColor: l.paid ? "#ecfdf5" : "#f9fafb" }}>
                        {l.paid ? "✓ Pago" : "Marcar pago"}
                      </button>
                    </td>
                  </tr>
                ))}
                {monthLessons.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Nenhuma aula neste mês</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Resumo por aluno</h2>
          {byStudent.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Sem dados no mês</p>
          ) : (
            <ul className="space-y-3">
              {byStudent.map(([id, s]) => (
                <li key={id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color || "#635bff" }} />
                      {s.name}
                    </span>
                    <span className="text-xs text-gray-400">{s.count} aulas</span>
                  </div>
                  <div className="mt-1.5 flex justify-between text-sm">
                    <span style={{ color: "#059669" }}>+ {formatBRL(s.earned)}</span>
                    {s.owed > 0 && <span style={{ color: "#dc2626" }}>− {formatBRL(s.owed)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}