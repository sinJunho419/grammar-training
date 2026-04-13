"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWrongAnswerCount } from "@/lib/wrong-answers";

const grades = [
  { grade: 7,  label: "Bronze",      sub: "중1", color: "#b45309" },
  { grade: 8,  label: "Silver",      sub: "중2", color: "#64748b" },
  { grade: 9,  label: "Gold",        sub: "중3", color: "#ca8a04" },
  { grade: 10, label: "Platinum",    sub: "고1", color: "#0891b2" },
  { grade: 11, label: "Diamond",     sub: "고2", color: "#4f46e5" },
  { grade: 12, label: "Grandmaster", sub: "고3", color: "#dc2626" },
];

export default function Home() {
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    getWrongAnswerCount().then(setWrongCount);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-medium text-slate-400 tracking-widest uppercase mb-1.5">
          Grammar Logic System
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          9대 로직 영문법
        </h1>
      </div>

      {/* Grade list */}
      <div className="flex flex-col gap-2.5 mb-8">
        {grades.map(({ grade, label, sub, color }) => (
          <Link
            key={grade}
            href={`/grade/${grade}`}
            className="group flex items-center gap-4 bg-white rounded-xl px-4 py-3.5 border border-slate-200/80 hover:border-primary-300 hover:shadow-sm transition-all duration-150"
          >
            <div
              className="w-1 h-8 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-slate-900 text-[15px]">{label}</span>
                <span className="text-xs text-slate-400">{sub}</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Wrong answers */}
      <Link
        href="/wrong-answers"
        className="flex items-center justify-between bg-white rounded-xl px-4 py-3.5 border border-slate-200/80 hover:border-primary-300 hover:shadow-sm transition-all duration-150"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-medium text-slate-700 text-[15px]">오답노트</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          wrongCount > 0
            ? "bg-primary-100 text-primary-700"
            : "bg-slate-100 text-slate-400"
        }`}>
          {wrongCount}
        </span>
      </Link>
    </div>
  );
}
