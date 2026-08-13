"use client";

import { useState } from "react";

type Student = { id: string; name: string; lessonValue: number };
type Lesson = {
  id: string;
  studentId: string;
  date: string;
  durationMin: number;
  topic: string | null;
  material: string | null;
  status: string;
  value: number;
  paid: boolean;
  isMakeUp: boolean;
  notes: string | null;
  student: Student;
};

type Props = {
  students: Student[];
  editing: Lesson | null;
  initialDate: string | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
};

function toLocalInput(date: string) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export default function LessonModal({
  students,
  editing,
  initialDate,
  onClose,
  onSaved,
  onDelete,
  onStatusChange,
}: Props) {
  const [studentId, setStudentId] = useState(editing?.studentId || "");
  const [datetime, setDatetime] = useState(editing ? toLocalInput(editing.date) : initialDate ? `${initialDate}T09:00` : "");
  const [durationMin, setDurationMin] = useState(editing?.durationMin || 60);
  const [topic, setTopic] = useState(editing?.topic || "");
  const [material, setMaterial] = useState(editing?.material || "");
  const [status, setStatus] = useState(editing?.status || "AGENDADA");
  const [value, setValue] = useState(editing ? String(editing.value) : "");
  const [paid, setPaid] = useState(editing?.paid || false);
  const [isMakeUp, setIsMakeUp] = useState(editing?.isMakeUp || false);
  const [notes, setNotes] = useState(editing?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing && studentId) {
    const st = students.find((s) => s.id === studentId);
    if (st && !value) setValue(String(st.lessonValue));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        studentId,
        date: new Date(datetime).toISOString(),
        durationMin: Number(durationMin),
        topic,
        material,
        status,
        value: Number(value) || 0,
        paid,
        isMakeUp,
        notes,
      };
      const res = await fetch(editing ? `/api/lessons/${editing.id}` : "/api/lessons", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao salvar");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{editing ? "Editar aula" : "Nova aula"}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="stripe-label">Aluno *</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required className="stripe-input">
                <option value="">Selecione...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="stripe-label">Data e hora *</label>
                <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required className="stripe-input" />
              </div>
              <div>
                <label className="stripe-label">Duração (min)</label>
                <input type="number" min={15} step={15} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="stripe-input" />
              </div>
            </div>

            <div>
              <label className="stripe-label">Tópico da aula</label>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Escalas, acordes, música..." className="stripe-input" />
            </div>

            <div>
              <label className="stripe-label">Material usado</label>
              <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Método Hanon, apostila..." className="stripe-input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="stripe-label">Valor (R$)</label>
                <input type="number" min={0} step="0.01" value={value} onChange={(e) => setValue(e.target.value)} className="stripe-input" />
              </div>
              <div>
                <label className="stripe-label">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="stripe-input">
                  <option value="AGENDADA">Agendada</option>
                  <option value="REPOSICAO">Reposição</option>
                  <option value="CONCLUIDA">Concluída</option>
                  <option value="FALTA">Falta</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={isMakeUp} onChange={(e) => setIsMakeUp(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#635bff] focus:ring-[#635bff]" />
                Aula de reposição
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#635bff] focus:ring-[#635bff]" />
                Paga
              </label>
            </div>

            <div>
              <label className="stripe-label">Observações</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="stripe-input resize-none" />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg px-3 py-2 text-sm text-red-600" style={{ backgroundColor: "#fef2f2" }}>
              {error}
            </p>
          )}
        </form>

        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div className="flex gap-2">
            {onDelete && (
              <button type="button" onClick={onDelete} className="stripe-btn-secondary text-red-600 hover:bg-red-50">
                Excluir
              </button>
            )}
            {onStatusChange && editing && status !== "CONCLUIDA" && (
              <button type="button" onClick={() => onStatusChange("CONCLUIDA")} className="stripe-btn-secondary" style={{ color: "#059669" }}>
                Concluir
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="stripe-btn-secondary">
              Cancelar
            </button>
            <button type="submit" form={undefined} disabled={saving} onClick={handleSubmit} className="stripe-btn-primary disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}