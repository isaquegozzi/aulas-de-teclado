"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatBRL, formatDate } from "@/lib/format";

type Student = { id: string; name: string; color: string | null };
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
  student: Student;
};

type DashboardData = {
  totalStudents: number;
  activeStudents: number;
  upcomingLessons: Lesson[];
  todayLessons: Lesson[];
  monthlyRevenue: number;
  monthlyPending: number;
  outstandingCredits: number;
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  AGENDADA: { label: "Agendada", color: "#4f46e5", bg: "#eef2ff" },
  REPOSICAO: { label: "Reposição", color: "#7c3aed", bg: "#f5f3ff" },
  CONCLUIDA: { label: "Concluída", color: "#059669", bg: "#ecfdf5" },
  CANCELADA: { label: "Cancelada", color: "#6b7280", bg: "#f3f4f6" },
  FALTA: { label: "Falta", color: "#dc2626", bg: "#fef2f2" },
};

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#635bff]" />
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Alunos ativos",
      value: data.activeStudents,
      sub: `${data.totalStudents} no total`,
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      color: "#635bff",
    },
    {
      label: "Aulas hoje",
      value: data.todayLessons.length,
      sub: "na agenda de hoje",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      color: "#059669",
    },
    {
      label: "Receita do mês",
      value: formatBRL(data.monthlyRevenue),
      sub: `${formatBRL(data.monthlyPending)} pendente`,
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "#059669",
    },
    {
      label: "Reposições pendentes",
      value: data.outstandingCredits,
      sub: "aulas a repor",
      icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
      color: "#7c3aed",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Visão geral</h1>
        <p className="mt-1 text-sm text-gray-500">Acompanhe suas aulas e finanças</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card card-hover p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${stat.color}10` }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={stat.color}
                  strokeWidth={1.8}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Aulas de hoje</h2>
            <Link
              href="/agenda"
              className="text-sm font-medium text-[#635bff] hover:text-[#5148e6]"
            >
              Ver agenda
            </Link>
          </div>
          <div className="p-6">
            {data.todayLessons.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Nenhuma aula hoje</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.todayLessons.map((l) => {
                  const status = statusConfig[l.status] || statusConfig.AGENDADA;
                  return (
                    <li key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: l.student.color || "#635bff" }}
                        >
                          {l.student.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{l.student.name}</p>
                          <p className="text-xs text-gray-500">{l.topic || l.material || "Aula"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="badge"
                          style={{ backgroundColor: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(l.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Próximas aulas</h2>
            <Link
              href="/agenda"
              className="text-sm font-medium text-[#635bff] hover:text-[#5148e6]"
            >
              Ver agenda
            </Link>
          </div>
          <div className="p-6">
            {data.upcomingLessons.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Nenhuma aula futura agendada</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.upcomingLessons.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: l.student.color || "#635bff" }}
                      >
                        {l.student.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{l.student.name}</p>
                        <p className="text-xs text-gray-500">{l.topic || "Aula"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{formatDate(l.date)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(l.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}