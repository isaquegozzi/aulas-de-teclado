"use client";

import { useState } from "react";

type Student = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  level: string;
  lessonValue: number;
  color: string | null;
  active: boolean;
  notes: string | null;
};

type Props = {
  student: Student | null;
  onClose: () => void;
  onSaved: () => void;
};

const COLORS = ["#635bff", "#4f46e5", "#7c3aed", "#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#e11d48", "#9333ea"];

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  level: "INICIANTE",
  lessonValue: "",
  color: "#635bff",
  notes: "",
};

export default function StudentModal({ student, onClose, onSaved }: Props) {
  const [form, setForm] = useState(
    student
      ? {
          name: student.name,
          phone: student.phone || "",
          email: student.email || "",
          level: student.level,
          lessonValue: String(student.lessonValue),
          color: student.color || "#635bff",
          notes: student.notes || "",
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        level: form.level,
        lessonValue: Number(form.lessonValue) || 0,
        color: form.color,
        notes: form.notes,
      };
      const res = await fetch(student ? `/api/students/${student.id}` : "/api/students", {
        method: student ? "PUT" : "POST",
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-xl bg-white shadow-2xl sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{student ? "Editar aluno" : "Novo aluno"}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="stripe-label">Nome *</label>
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Nome completo" className="stripe-input" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="stripe-label">Telefone</label>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(00) 00000-0000" className="stripe-input" />
              </div>
              <div>
                <label className="stripe-label">Email</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="stripe-input" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="stripe-label">Nível</label>
                <select value={form.level} onChange={(e) => set("level", e.target.value)} className="stripe-input">
                  <option value="INICIANTE">Iniciante</option>
                  <option value="INTERMEDIARIO">Intermediário</option>
                  <option value="AVANCADO">Avançado</option>
                </select>
              </div>
              <div>
                <label className="stripe-label">Valor da aula (R$)</label>
                <input type="number" min={0} step="0.01" value={form.lessonValue} onChange={(e) => set("lessonValue", e.target.value)} className="stripe-input" />
              </div>
            </div>

            <div>
              <label className="stripe-label">Cor</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("color", c)}
                    className={`h-7 w-7 rounded-full transition-transform ${form.color === c ? "scale-110 ring-2 ring-offset-2" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="stripe-label">Observações</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Preferências, horários..." className="stripe-input resize-none" />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg px-3 py-2 text-sm text-red-600" style={{ backgroundColor: "#fef2f2" }}>
              {error}
            </p>
          )}
        </form>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} className="stripe-btn-secondary">Cancelar</button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="stripe-btn-primary disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}