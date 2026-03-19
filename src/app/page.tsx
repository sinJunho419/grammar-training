"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWrongAnswerCount } from "@/lib/wrong-answers";

const grades = [
  {
    grade: 7,
    label: "Bronze",
    sub: "중1",
    gradient: "from-amber-700 via-amber-600 to-yellow-700",
    ring: "ring-amber-400/40",
    icon: "🛡️",
    shadow: "shadow-amber-300/30",
  },
  {
    grade: 8,
    label: "Silver",
    sub: "중2",
    gradient: "from-gray-400 via-slate-300 to-gray-400",
    ring: "ring-gray-300/40",
    icon: "⚔️",
    shadow: "shadow-gray-300/30",
  },
  {
    grade: 9,
    label: "Gold",
    sub: "중3",
    gradient: "from-yellow-500 via-amber-400 to-yellow-500",
    ring: "ring-yellow-300/40",
    icon: "👑",
    shadow: "shadow-yellow-300/30",
  },
  {
    grade: 10,
    label: "Platinum",
    sub: "고1",
    gradient: "from-cyan-500 via-teal-400 to-cyan-500",
    ring: "ring-cyan-300/40",
    icon: "💎",
    shadow: "shadow-cyan-300/30",
  },
  {
    grade: 11,
    label: "Diamond",
    sub: "고2",
    gradient: "from-blue-600 via-indigo-500 to-purple-600",
    ring: "ring-blue-400/40",
    icon: "🔮",
    shadow: "shadow-blue-300/30",
  },
  {
    grade: 12,
    label: "Grandmaster",
    sub: "고3",
    gradient: "from-red-600 via-rose-500 to-orange-500",
    ring: "ring-red-400/40",
    icon: "🏆",
    shadow: "shadow-red-300/30",
  },
];

export default function Home() {
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    getWrongAnswerCount().then(setWrongCount);
  }, []);

  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-sm font-medium text-gray-400 tracking-widest uppercase mb-2">Grammar Logic System</p>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          9대 로직 영문법
        </h1>
        <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      </div>

      {/* 오답노트 */}
      <Link
        href="/wrong-answers"
        className="group relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 p-4 shadow-lg shadow-orange-300/30 ring-2 ring-orange-400/30 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] transition-all duration-200 mb-6 max-w-[240px] mx-auto overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <span className="text-2xl drop-shadow-md">📝</span>
        <span className="text-white font-bold text-base tracking-wide drop-shadow-sm">오답노트</span>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          wrongCount > 0
            ? "bg-white text-orange-600"
            : "bg-white/30 text-white"
        }`}>
          {wrongCount}
        </span>
      </Link>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {grades.map(({ grade, label, sub, gradient, ring, icon, shadow }) => (
          <Link
            key={grade}
            href={`/grade/${grade}`}
            className={`group relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} p-5 ring-2 ${ring} shadow-lg ${shadow} hover:scale-105 hover:shadow-xl active:scale-95 transition-all duration-200 overflow-hidden`}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <span className="text-3xl mb-1 drop-shadow-md">{icon}</span>
            <span className="text-white font-bold text-base tracking-wide drop-shadow-sm">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
