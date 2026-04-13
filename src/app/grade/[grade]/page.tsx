"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAllCompletions } from "@/lib/completion";

const gradeConfig: Record<number, { label: string; sub: string; color: string }> = {
  7:  { label: "Bronze",      sub: "중1", color: "#b45309" },
  8:  { label: "Silver",      sub: "중2", color: "#64748b" },
  9:  { label: "Gold",        sub: "중3", color: "#ca8a04" },
  10: { label: "Platinum",    sub: "고1", color: "#0891b2" },
  11: { label: "Diamond",     sub: "고2", color: "#4f46e5" },
  12: { label: "Grandmaster", sub: "고3", color: "#dc2626" },
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
      <div className="mb-8">
        <Link href="/" className="text-xs text-slate-400 hover:text-primary-600 transition-colors">
          &larr; 홈
        </Link>
        <div className="flex items-center gap-2.5 mt-2">
          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: config.color }} />
          <h1 className="text-xl font-bold text-slate-900">
            {config.label}
            <span className="text-sm font-normal text-slate-400 ml-2">{config.sub}</span>
          </h1>
        </div>
      </div>

      {/* Logic list */}
      <div className="flex flex-col gap-2.5">
        {logics.map((logic) => {
          const count = completions[logic.logic_no] || 0;
          return (
            <Link
              key={logic.logic_no}
              href={`/grade/${grade}/logic/${logic.logic_no}`}
              className="group flex items-center gap-4 bg-white rounded-xl px-4 py-3.5 border border-slate-200/80 hover:border-primary-300 hover:shadow-sm transition-all duration-150"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center text-sm font-bold text-slate-500 group-hover:text-primary-600 transition-colors">
                {logic.logic_no}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-800 text-[15px]">
                  {logicNames[logic.logic_no] || logic.name}
                </span>
              </div>
              {count > 0 ? (
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                  {count}회
                </span>
              ) : (
                <span className="text-xs text-slate-300">미학습</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
