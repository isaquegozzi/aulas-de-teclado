"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDate, formatTime } from "@/lib/format";

type Student = { id: string; name: string; color: string | null };
type Credit = { id: string; reason: string; used: boolean; usedAt: string | null; createdAt: string; student: Student };
type Lesson = { id: string; date: string; durationMin: number; topic: string | null; status: string; isMakeUp: boolean; student: Student };

export default function MakeupsClient() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [pendingLessons, setPendingLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({ studentId: "", reason: "" });
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [makeupsRes, studentsRes] = await Promise.all([fetch("/api/makeups"), fetch("/api/students")]);
    const data = await makeupsRes.json();
    setCredits(data.credits);
    setPendingLessons(data.pendingLessons);
    setStudents(await studentsRes.json());
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function addCredit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentId || !form.reason.trim()) return;
    await fetch("/api/makeups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: form.studentId, reason: form.reason.trim() }) });
    setForm({ studentId: "", reason: "" });
    void load();
  }

  async function markUsed(id: string) {
    await fetch("/api/makeups", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    void load();
  }

  async function createMakeupLesson(credit: Credit) {
    const dateStr = prompt("Data e hora da aula de reposição (YYYY-MM-DDTHH:MM):");
    if (!dateStr) return;
    const res = await fetch("/api/lessons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: credit.student.id, date: new Date(dateStr).toISOString(), durationMin: 60, topic: "Reposição de aula", status: "REPOSICAO", isMakeUp: true }) });
    if (res.ok) { await markUsed(credit.id); setMessage(`Reposição agendada para ${credit.student.name}!`); void load(); }
  }

  const openCredits = credits.filter((c) => !c.used);
  const usedCredits = credits.filter((c) => c.used);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reposições</h1>
        <p className="mt-1 text-sm text-gray-500">Acompanhe aulas que precisam ser repostas</p>
      </div>

      {message && (
        <p className="rounded-lg px-4 py-2 text-sm" style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>{message}</p>
      )}

      <form onSubmit={addCredit} className="card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap">
        <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required className="stripe-input w-full sm:w-[200px]">
          <option value="">Selecione o aluno...</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required placeholder="Motivo da reposição..." className="stripe-input flex-1" />
        <button type="submit" className="stripe-btn-primary">Registrar</button>
      </form>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Pendentes ({openCredits.length})</h2>
          {openCredits.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Nenhuma reposição pendente</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {openCredits.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.student.color || "#635bff" }} />
                      {c.student.name}
                    </p>
                    <p className="text-xs text-gray-500">{c.reason}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{formatDate(c.createdAt)}</p>
                  </div>
                  <button onClick={() => createMakeupLesson(c)} className="stripe-btn-primary shrink-0 text-xs">
                    Agendar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Próximas aulas (14 dias)</h2>
          {pendingLessons.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Nenhuma aula agendada nos próximos 14 dias</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {pendingLessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.student.color || "#635bff" }} />
                      {l.student.name}
                    </p>
                    <p className="text-xs text-gray-500">{l.topic || "Aula"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{formatDate(l.date)}</p>
                    <p className="text-xs text-gray-500">{formatTime(l.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {usedCredits.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Reposições realizadas ({usedCredits.length})</h2>
          <ul className="divide-y divide-gray-100">
            {usedCredits.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                <span>{c.student.name} — {c.reason}</span>
                <span className="text-xs" style={{ color: "#059669" }}>✓ em {c.usedAt ? formatDate(c.usedAt) : "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}