"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWrongAnswerCount } from "@/lib/wrong-answers";

const grades = [
  { grade: 7,  label: "Bronze",      color: "#b45309" },
  { grade: 8,  label: "Silver",      color: "#64748b" },
  { grade: 9,  label: "Gold",        color: "#ca8a04" },
  { grade: 10, label: "Platinum",    color: "#0891b2" },
  { grade: 11, label: "Diamond",     color: "#6366f1" },
  { grade: 12, label: "Grandmaster", color: "#dc2626" },
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
        <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1">
          Grammar Logic System
        </p>
        <h1 className="text-[1.6rem] font-extrabold text-[#2d3436]">
          9대 로직 영문법
        </h1>
      </div>

      {/* Grade list - single column */}
      <div className="flex flex-col gap-3 mb-6">
        {grades.map(({ grade, label, color }) => (
          <Link
            key={grade}
            href={`/grade/${grade}`}
            className="group bg-[#eef2ff] rounded-[20px] border border-[#e0e7ff] shadow-[0_10px_25px_rgba(0,0,0,0.03)] overflow-hidden hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300"
          >
            <div className="h-[3px]" style={{ backgroundColor: color }} />
            <div className="flex items-center gap-4 px-5 py-4">
              <div
                className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: color }}
              >
                <span className="text-white text-sm font-extrabold">{label.charAt(0)}</span>
              </div>
              <span className="font-extrabold text-[#2d3436] text-[1.05rem]">{label}</span>
              <svg className="w-4 h-4 text-indigo-300 group-hover:text-indigo-500 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Wrong answers */}
      <Link
        href="/wrong-answers"
        className="group flex items-center justify-between bg-[#eef2ff] rounded-[20px] border border-[#e0e7ff] shadow-[0_10px_25px_rgba(0,0,0,0.03)] px-5 py-4 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-[42px] h-[42px] rounded-[12px] bg-primary-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-extrabold text-[#2d3436] text-[1.05rem]">오답노트</span>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          wrongCount > 0
            ? "bg-primary-200 text-primary-700"
            : "bg-indigo-100 text-indigo-300"
        }`}>
          {wrongCount}
        </span>
      </Link>
    </div>
  );
}
