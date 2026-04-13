"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAllCompletions } from "@/lib/completion";

const gradeConfig: Record<number, { label: string; color: string; light: string; headerBg: string }> = {
  7:  { label: "Bronze",      color: "#b45309", light: "#fef3c7", headerBg: "#fffbeb" },
  8:  { label: "Silver",      color: "#64748b", light: "#f1f5f9", headerBg: "#f8fafc" },
  9:  { label: "Gold",        color: "#ca8a04", light: "#fef9c3", headerBg: "#fefce8" },
  10: { label: "Platinum",    color: "#0891b2", light: "#cffafe", headerBg: "#ecfeff" },
  11: { label: "Diamond",     color: "#6366f1", light: "#e0e7ff", headerBg: "#eef2ff" },
  12: { label: "Grandmaster", color: "#dc2626", light: "#fee2e2", headerBg: "#fef2f2" },
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
      {/* Header */}
      <div className="-mx-5 -mt-8 px-6 pt-8 pb-6 mb-6 rounded-b-[24px]" style={{ backgroundColor: config.headerBg }}>
        <div className="flex items-center gap-4">
          <div
            className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center font-extrabold text-lg"
            style={{ backgroundColor: config.light, color: config.color }}
          >
            {config.label.charAt(0)}
          </div>
          <h1 className="text-xl font-extrabold" style={{ color: config.color }}>
            {config.label}
          </h1>
        </div>
      </div>

      {/* Logic list */}
      <div className="grid grid-cols-2 gap-3 pb-20">
        {logics.map((logic) => {
          const count = completions[logic.logic_no] || 0;
          return (
            <Link
              key={logic.logic_no}
              href={`/grade/${grade}/logic/${logic.logic_no}`}
              className="group bg-white rounded-[20px] border border-[#edf2f7] shadow-[0_10px_25px_rgba(0,0,0,0.03)] overflow-hidden hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="h-[3px]" style={{ backgroundColor: config.color }} />
              <div className="p-4">
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center text-sm font-extrabold mb-2.5"
                  style={{ backgroundColor: config.light, color: config.color }}
                >
                  {logic.logic_no}
                </div>
                <div className="font-bold text-[#2d3436] text-sm leading-snug">
                  {logicNames[logic.logic_no] || logic.name}
                </div>
                <div className="mt-2">
                  {count > 0 ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: config.light, color: config.color }}>
                      {count}회 완료
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-300">미학습</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Floating back */}
      <Link
        href="/"
        className="fixed bottom-6 left-6 w-12 h-12 bg-white border border-[#edf2f7] rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex items-center justify-center hover:shadow-[0_15px_35px_rgba(0,0,0,0.12)] hover:-translate-y-1 active:scale-90 transition-all duration-300 z-50"
      >
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </div>
  );
}
