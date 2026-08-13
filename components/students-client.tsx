"use client";

import { useCallback, useEffect, useState } from "react";
import StudentModal from "@/components/student-modal";
import StudentDetail from "@/components/student-detail";

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
  _count?: { lessons: number; makeUpCredits: number };
};

const levelLabel: Record<string, string> = {
  INICIANTE: "Iniciante",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
};

const levelConfig: Record<string, { color: string; bg: string }> = {
  INICIANTE: { color: "#059669", bg: "#ecfdf5" },
  INTERMEDIARIO: { color: "#d97706", bg: "#fffbeb" },
  AVANCADO: { color: "#dc2626", bg: "#fef2f2" },
};

export default function StudentsClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/students");
    setStudents(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    if (!confirm("Excluir este aluno? Todos os dados serão removidos.")) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Alunos</h1>
          <p className="mt-1 text-sm text-gray-500">{students.length} cadastrados</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno..."
              className="stripe-input pl-9"
              style={{ width: "240px" }}
            />
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="stripe-btn-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Novo aluno
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Aluno</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nível</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contato</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Valor aula</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Aulas</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => {
              const lc = levelConfig[s.level] || levelConfig.INICIANTE;
              return (
                <tr key={s.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <button
                      className="flex items-center gap-3 text-left"
                      onClick={() => {
                        setDetailId(s.id);
                        setDetailOpen(true);
                      }}
                    >
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: s.color || "#635bff" }}
                      >
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#635bff] hover:underline">{s.name}</span>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="badge" style={{ backgroundColor: lc.bg, color: lc.color }}>
                      {levelLabel[s.level] || s.level}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                    {s.phone || "—"}
                    {s.email && <span className="block text-xs text-gray-400">{s.email}</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900">
                    {s.lessonValue
                      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.lessonValue)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500">{s._count?.lessons || 0}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className="badge"
                      style={{
                        backgroundColor: s.active ? "#ecfdf5" : "#f3f4f6",
                        color: s.active ? "#059669" : "#6b7280",
                      }}
                    >
                      {s.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(s);
                          setModalOpen(true);
                        }}
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#635bff]"
                        title="Editar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Excluir"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  Nenhum aluno encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <StudentModal
          student={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            setModalOpen(false);
            setEditing(null);
            void load();
          }}
        />
      )}

      {detailOpen && detailId && (
        <StudentDetail
          studentId={detailId}
          onClose={() => {
            setDetailOpen(false);
            setDetailId(null);
          }}
          onChanged={() => void load()}
        />
      )}
    </div>
  );
}