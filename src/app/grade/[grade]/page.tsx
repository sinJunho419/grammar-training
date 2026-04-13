"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAllCompletions } from "@/lib/completion";

const gradeConfig: Record<number, { label: string; sub: string; icon: string; bg: string; text: string; badge: string; border: string }> = {
  7:  { label: "Bronze",      sub: "중1", icon: "🛡️", bg: "bg-amber-50",  text: "text-amber-800",  badge: "bg-amber-600",  border: "border-amber-200" },
  8:  { label: "Silver",      sub: "중2", icon: "⚔️", bg: "bg-slate-50",  text: "text-slate-700",  badge: "bg-slate-500",  border: "border-slate-200" },
  9:  { label: "Gold",        sub: "중3", icon: "👑", bg: "bg-yellow-50", text: "text-yellow-800", badge: "bg-yellow-500", border: "border-yellow-200" },
  10: { label: "Platinum",    sub: "고1", icon: "💎", bg: "bg-cyan-50",   text: "text-cyan-800",   badge: "bg-cyan-500",   border: "border-cyan-200" },
  11: { label: "Diamond",     sub: "고2", icon: "🔮", bg: "bg-indigo-50", text: "text-indigo-800", badge: "bg-indigo-500", border: "border-indigo-200" },
  12: { label: "Grandmaster", sub: "고3", icon: "🏆", bg: "bg-red-50",    text: "text-red-800",    badge: "bg-red-500",    border: "border-red-200" },
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
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <span className="text-3xl mb-1">{config.icon}</span>
        <h1 className="text-xl font-bold text-gray-900">
          {config.label} <span className="text-sm font-normal text-gray-400">{config.sub}</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {logics.map((logic) => {
          const count = completions[logic.logic_no] || 0;
          return (
            <Link
              key={logic.logic_no}
              href={`/grade/${grade}/logic/${logic.logic_no}`}
              className={`group relative flex flex-col items-center justify-center rounded-2xl ${config.bg} ${config.border} border p-4 hover:shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all duration-200`}
            >
              <div className={`${config.text} font-bold text-lg`}>
                L{logic.logic_no}
              </div>
              <div className={`text-sm font-semibold ${config.text} text-center mt-0.5`}>
                {logicNames[logic.logic_no] || logic.name}
              </div>
              <div className={`mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full text-white ${count > 0 ? config.badge : "bg-gray-300"}`}>
                {count > 0 ? `${count}회 완료` : "미학습"}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="inline-block px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors">
          돌아가기
        </Link>
      </div>
    </div>
  );
}
