"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWrongAnswerCount } from "@/lib/wrong-answers";

const grades = [
  { grade: 7,  label: "Bronze",      sub: "중1", color: "#b45309", bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-200/60", accent: "bg-amber-600" },
  { grade: 8,  label: "Silver",      sub: "중2", color: "#64748b", bg: "bg-slate-50",   text: "text-slate-700",  border: "border-slate-200/60", accent: "bg-slate-500" },
  { grade: 9,  label: "Gold",        sub: "중3", color: "#ca8a04", bg: "bg-yellow-50",  text: "text-yellow-800", border: "border-yellow-200/60", accent: "bg-yellow-500" },
  { grade: 10, label: "Platinum",    sub: "고1", color: "#0891b2", bg: "bg-cyan-50",    text: "text-cyan-800",   border: "border-cyan-200/60",  accent: "bg-cyan-600" },
  { grade: 11, label: "Diamond",     sub: "고2", color: "#4f46e5", bg: "bg-indigo-50",  text: "text-indigo-800", border: "border-indigo-200/60", accent: "bg-indigo-600" },
  { grade: 12, label: "Grandmaster", sub: "고3", color: "#dc2626", bg: "bg-red-50",     text: "text-red-800",    border: "border-red-200/60",   accent: "bg-red-600" },
];

export default function Home() {
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    getWrongAnswerCount().then(setWrongCount);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-medium text-slate-400 tracking-widest uppercase mb-1.5">
          Grammar Logic System
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          9대 로직 영문법
        </h1>
      </div>

      {/* Grade cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {grades.map(({ grade, label, sub, bg, text, border, accent }) => (
          <Link
            key={grade}
            href={`/grade/${grade}`}
            className={`group relative rounded-2xl ${bg} ${border} border overflow-hidden hover:shadow-md active:scale-[0.97] transition-all duration-150`}
          >
            <div className={`${accent} h-1.5 w-full`} />
            <div className="px-4 py-4">
              <div className={`font-bold text-[15px] ${text}`}>{label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
            </div>
            <svg className="absolute right-3 top-1/2 w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Wrong answers */}
      <Link
        href="/wrong-answers"
        className="flex items-center justify-between bg-primary-50 rounded-xl px-4 py-3.5 border border-primary-200/60 hover:shadow-sm transition-all duration-150"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-medium text-primary-700 text-[15px]">오답노트</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          wrongCount > 0
            ? "bg-primary-200 text-primary-700"
            : "bg-primary-100 text-primary-400"
        }`}>
          {wrongCount}
        </span>
      </Link>
    </div>
  );
}
