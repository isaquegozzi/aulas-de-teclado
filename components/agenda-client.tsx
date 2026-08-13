"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, WEEKDAYS } from "@/lib/format";
import LessonModal from "@/components/lesson-modal";

type Student = { id: string; name: string; color: string | null; lessonValue: number };
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

const statusStyles: Record<string, { border: string; bg: string; text: string }> = {
  AGENDADA: { border: "#4f46e5", bg: "#eef2ff", text: "#4f46e5" },
  REPOSICAO: { border: "#7c3aed", bg: "#f5f3ff", text: "#7c3aed" },
  CONCLUIDA: { border: "#059669", bg: "#ecfdf5", text: "#059669" },
  CANCELADA: { border: "#d1d5db", bg: "#f9fafb", text: "#9ca3af" },
  FALTA: { border: "#dc2626", bg: "#fef2f2", text: "#dc2626" },
};

export default function AgendaClient() {
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    return addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -day);
  });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const load = useCallback(async () => {
    const from = addDays(weekStart, 0);
    const to = addDays(weekStart, 6);
    const params = new URLSearchParams({
      from: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`,
      to: `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, "0")}-${String(to.getDate()).padStart(2, "0")}`,
    });
    const [lessonsRes, studentsRes] = await Promise.all([
      fetch(`/api/lessons?${params}`),
      fetch("/api/students"),
    ]);
    setLessons(await lessonsRes.json());
    setStudents(await studentsRes.json());
  }, [weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  const lessonsByDay = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const l of lessons) {
      const key = l.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    for (const list of map.values()) list.sort((a, b) => a.date.localeCompare(b.date));
    return map;
  }, [lessons]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta aula?")) return;
    await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    void load();
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/lessons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void load();
  }

  function openNew(day: Date) {
    setEditing(null);
    setSelectedDate(
      `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
    );
    setModalOpen(true);
  }

  function openEdit(lesson: Lesson) {
    setEditing(lesson);
    setSelectedDate(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Agenda</h1>
          <p className="mt-1 text-sm text-gray-500">
            {days[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} —{" "}
            {days[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="stripe-btn-secondary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setWeekStart(addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -now.getDay()));
            }}
            className="stripe-btn-secondary"
          >
            Hoje
          </button>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="stripe-btn-secondary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => openNew(days[0])}
            className="stripe-btn-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nova aula
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
        {days.map((day) => {
          const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const dayLessons = lessonsByDay.get(key) || [];
          const isToday = key === todayStr;
          return (
            <div
              key={key}
              className={`card overflow-hidden ${
                isToday ? "ring-2 ring-[#635bff]" : ""
              }`}
            >
              <div className={`flex items-center justify-between border-b px-3 py-2.5 ${
                isToday ? "bg-[#635bff]" : "bg-gray-50"
              }`}>
                <p className={`text-xs font-medium ${
                  isToday ? "text-white" : "text-gray-500"
                }`}>
                  {WEEKDAYS[day.getDay()]}
                </p>
                <p className={`text-sm font-semibold ${
                  isToday ? "text-white" : "text-gray-900"
                }`}>
                  {String(day.getDate()).padStart(2, "0")}
                </p>
              </div>
              <div className="min-h-[120px] space-y-1.5 p-2">
                {dayLessons.length === 0 && (
                  <p className="py-4 text-center text-xs text-gray-300">—</p>
                )}
                {dayLessons.map((l) => {
                  const time = new Date(l.date).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const s = statusStyles[l.status] || statusStyles.AGENDADA;
                  return (
                    <button
                      key={l.id}
                      className="w-full cursor-pointer rounded-md border px-2 py-1.5 text-left transition-colors hover:shadow-sm"
                      style={{ borderColor: s.border, backgroundColor: s.bg }}
                      onClick={() => openEdit(l)}
                      title={l.material || l.topic || l.student.name}
                    >
                      <p className="flex items-center justify-between">
                        <span className="truncate text-xs font-medium" style={{ color: s.text }}>
                          {l.student.name}
                        </span>
                        <span className="ml-1 shrink-0 text-[10px]" style={{ color: s.text }}>
                          {time}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-[10px] opacity-70" style={{ color: s.text }}>
                        {l.topic || (l.isMakeUp ? "Reposição" : "Aula")}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <LessonModal
          students={students}
          editing={editing}
          initialDate={selectedDate}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            setModalOpen(false);
            setEditing(null);
            void load();
          }}
          onDelete={editing ? () => handleDelete(editing.id) : undefined}
          onStatusChange={editing ? (s) => handleStatusChange(editing.id, s) : undefined}
        />
      )}
    </div>
  );
}