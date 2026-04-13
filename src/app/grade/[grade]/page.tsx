"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAllCompletions } from "@/lib/completion";

const gradeConfig: Record<number, { label: string; sub: string; color: string; bg: string; bgDeep: string; text: string; textLight: string; border: string; badge: string; badgeText: string }> = {
  7:  { label: "Bronze",      sub: "중1", color: "#b45309", bg: "bg-amber-50",   bgDeep: "bg-amber-600",  text: "text-amber-900",  textLight: "text-amber-600",  border: "border-amber-200/60",  badge: "bg-amber-100",  badgeText: "text-amber-700" },
  8:  { label: "Silver",      sub: "중2", color: "#64748b", bg: "bg-slate-50",   bgDeep: "bg-slate-500",  text: "text-slate-800",  textLight: "text-slate-500",  border: "border-slate-200/60",  badge: "bg-slate-100",  badgeText: "text-slate-600" },
  9:  { label: "Gold",        sub: "중3", color: "#ca8a04", bg: "bg-yellow-50",  bgDeep: "bg-yellow-500", text: "text-yellow-900", textLight: "text-yellow-600", border: "border-yellow-200/60", badge: "bg-yellow-100", badgeText: "text-yellow-700" },
  10: { label: "Platinum",    sub: "고1", color: "#0891b2", bg: "bg-cyan-50",    bgDeep: "bg-cyan-600",   text: "text-cyan-900",   textLight: "text-cyan-600",   border: "border-cyan-200/60",   badge: "bg-cyan-100",   badgeText: "text-cyan-700" },
  11: { label: "Diamond",     sub: "고2", color: "#4f46e5", bg: "bg-indigo-50",  bgDeep: "bg-indigo-600", text: "text-indigo-900", textLight: "text-indigo-600", border: "border-indigo-200/60", badge: "bg-indigo-100", badgeText: "text-indigo-700" },
  12: { label: "Grandmaster", sub: "고3", color: "#dc2626", bg: "bg-red-50",     bgDeep: "bg-red-600",    text: "text-red-900",    textLight: "text-red-600",    border: "border-red-200/60",    badge: "bg-red-100",    badgeText: "text-red-700" },
};

const logicNames: Record<number, string> = {
  1: "수 일치",
  2: "동사 vs 준동사",
  3: "능동 vs 수동",
  4: "관계사 vs 접속사",
  5: "형용사 vs 부사",
  6: "병렬 구조",
  7: "대명사 / 대동사",
  8: "조동사 / 가정법",
  9: "비교 / 특수구문",
};

export default function GradePage() {
  const params = useParams();
  const grade = parseInt(params.grade as string);
  const config = gradeConfig[grade] || gradeConfig[7];

  const [logics, setLogics] = useState<{ logic_no: number; name: string }[]>([]);
  const [completions, setCompletions] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/grammar/logics?grade=${grade}`);
      const logicList = res.ok ? await res.json() : [];
      setLogics(logicList);
      setCompletions(getAllCompletions(grade, logicList.map((l: { logic_no: number }) => l.logic_no)));
      setLoading(false);
    }
    load();
  }, [grade]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Color header */}
      <div className={`-mx-5 -mt-8 px-5 pt-8 pb-6 mb-6 ${config.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.bgDeep} flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">{grade > 9 ? `${grade - 9}` : `${grade - 6}`}</span>
          </div>
          <div>
            <h1 className={`text-xl font-bold ${config.text}`}>{config.label}</h1>
            <p className={`text-xs ${config.textLight}`}>{config.sub}</p>
          </div>
        </div>
      </div>

      {/* Logic list */}
      <div className="flex flex-col gap-2.5 pb-16">
        {logics.map((logic) => {
          const count = completions[logic.logic_no] || 0;
          return (
            <Link
              key={logic.logic_no}
              href={`/grade/${grade}/logic/${logic.logic_no}`}
              className={`group flex items-center gap-4 ${config.bg} rounded-xl px-4 py-3.5 border ${config.border} hover:shadow-md active:scale-[0.97] transition-all duration-150`}
            >
              <div className={`w-9 h-9 rounded-lg ${config.badge} flex items-center justify-center text-sm font-bold ${config.badgeText}`}>
                {logic.logic_no}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`font-medium ${config.text} text-[15px]`}>
                  {logicNames[logic.logic_no] || logic.name}
                </span>
              </div>
              {count > 0 ? (
                <span className={`text-xs font-semibold ${config.badgeText} ${config.badge} px-2.5 py-0.5 rounded-full`}>
                  {count}회
                </span>
              ) : (
                <span className="text-xs text-slate-300">미학습</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Floating back button */}
      <Link
        href="/"
        className="fixed bottom-6 left-6 w-11 h-11 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all z-50"
      >
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </div>
  );
}
