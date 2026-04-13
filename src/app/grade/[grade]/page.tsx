"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAllCompletions } from "@/lib/completion";

const gradeLabels: Record<number, string> = {
  7: "Bronze", 8: "Silver", 9: "Gold", 10: "Platinum", 11: "Diamond", 12: "Grandmaster",
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
  const label = gradeLabels[grade] || "Bronze";

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
    return <div className="flex items-center justify-center py-20"><div className="text-slate-400 text-sm">로딩 중...</div></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="-mx-5 -mt-8 px-6 pt-8 pb-6 mb-6 rounded-b-[24px] bg-[#eef2ff]">
        <div className="flex items-center gap-4">
          <div className="w-[50px] h-[50px] rounded-[14px] bg-primary-600 flex items-center justify-center">
            <span className="text-white font-extrabold text-lg">{label.charAt(0)}</span>
          </div>
          <h1 className="text-xl font-extrabold text-primary-800">{label}</h1>
        </div>
      </div>

      {/* Logic list - single column */}
      <div className="flex flex-col gap-3 pb-20">
        {logics.map((logic) => {
          const count = completions[logic.logic_no] || 0;
          return (
            <Link
              key={logic.logic_no}
              href={`/grade/${grade}/logic/${logic.logic_no}`}
              className="group flex items-center gap-4 bg-[#eef2ff] rounded-[20px] border border-[#e0e7ff] shadow-[0_10px_25px_rgba(0,0,0,0.03)] px-5 py-4 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-[12px] bg-primary-100 flex items-center justify-center text-sm font-extrabold text-primary-600">
                {logic.logic_no}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[#2d3436] text-[15px]">
                  {logicNames[logic.logic_no] || logic.name}
                </div>
              </div>
              {count > 0 ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary-100 text-primary-600">
                  {count}회
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-300">미학습</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Floating back */}
      <Link
        href="/"
        className="fixed bottom-6 left-6 w-12 h-12 bg-white border border-[#edf2f7] rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex items-center justify-center hover:-translate-y-1 active:scale-90 transition-all duration-300 z-50"
      >
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </div>
  );
}
