"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDate, formatTime } from "@/lib/format";

type Lesson = {
  id: string;
  date: string;
  durationMin: number;
  topic: string | null;
  material: string | null;
  status: string;
  value: number;
  student: { id: string; name: string; color: string | null };
};

export default function MaterialsClient() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [studentFilter, setStudentFilter] = useState("all");
  const [materialFilter, setMaterialFilter] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/lessons");
    setLessons(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return lessons
      .filter((l) => l.material || l.topic)
      .filter((l) => (studentFilter === "all" ? true : l.student.id === studentFilter))
      .filter((l) =>
        materialFilter
          ? (l.material || "").toLowerCase().includes(materialFilter.toLowerCase())
          : true
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [lessons, studentFilter, materialFilter]);

  const materialsList = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lessons) {
      if (!l.material) continue;
      const key = l.material.trim().toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [lessons]);

  const students = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null }>();
    for (const l of lessons) {
      if (!map.has(l.student.id)) map.set(l.student.id, { name: l.student.name, color: l.student.color });
    }
    return [...map.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [lessons]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Materiais</h1>
          <p className="mt-1 text-sm text-gray-500">O que foi ensinado e quais materiais foram usados</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="stripe-input w-full sm:w-[180px]"
          >
            <option value="all">Todos os alunos</option>
            {students.map(([id, s]) => (
              <option key={id} value={id}>{s.name}</option>
            ))}
          </select>
          <div className="relative w-full sm:w-[200px]">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              placeholder="Filtrar material..."
              className="stripe-input pl-9"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Aluno</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tópico</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Material</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.slice(0, 100).map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">
                      {formatDate(l.date)} · {formatTime(l.date)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.student.color || "#635bff" }} />
                        {l.student.name}
                      </span>
                    </td>
                    <td className="px-5 py-3">{l.topic || "—"}</td>
                    <td className="px-5 py-3">
                      {l.material ? (
                        <span className="badge" style={{ backgroundColor: "#eef2ff", color: "#4f46e5" }}>{l.material}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">Nenhum registro encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.slice(0, 100).map((l) => (
              <div key={l.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: l.student.color || "#635bff" }} />
                    <span className="truncate">{l.student.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {formatDate(l.date)} · {formatTime(l.date)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-900">{l.topic || "—"}</p>
                <div className="mt-2">
                  {l.material ? (
                    <span className="badge" style={{ backgroundColor: "#eef2ff", color: "#4f46e5" }}>{l.material}</span>
                  ) : (
                    <span className="text-xs text-gray-300">Sem material</span>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="card px-4 py-12 text-center text-sm text-gray-400">Nenhum registro encontrado</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Materiais mais usados</h2>
          {materialsList.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Nenhum material registrado ainda</p>
          ) : (
            <ul className="space-y-2">
              {materialsList.map((m, i) => (
                <li key={m.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
                      {i + 1}
                    </span>
                    <span className="capitalize">{m.name}</span>
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {m.count}x
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}