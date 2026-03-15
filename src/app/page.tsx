"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWrongAnswerCount } from "@/lib/wrong-answers";

const grades = [
  { grade: 7, label: "Bronze", color: "bg-amber-600" },
  { grade: 8, label: "Silver", color: "bg-gray-400" },
  { grade: 9, label: "Gold", color: "bg-yellow-500" },
  { grade: 10, label: "Platinum", color: "bg-cyan-500" },
  { grade: 11, label: "Diamond", color: "bg-blue-500" },
  { grade: 12, label: "Grandmaster", color: "bg-red-600" },
];

export default function Home() {
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    setWrongCount(getWrongAnswerCount());
  }, []);

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          9대 로직 영문법
        </h1>
      </div>

      {/* 오답노트 */}
      <Link
        href="/wrong-answers"
        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 p-4 hover:shadow-md transition-all mb-6 max-w-[200px] mx-auto"
      >
        <div className="font-semibold text-gray-800">오답노트</div>
        <div className={`text-sm font-bold px-3 py-1 rounded-full ${
          wrongCount > 0
            ? "bg-orange-500 text-white"
            : "bg-gray-200 text-gray-500"
        }`}>
          {wrongCount}
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {grades.map(({ grade, label, color }) => (
          <Link
            key={grade}
            href={`/grade/${grade}`}
            className="flex items-center justify-center rounded-2xl bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
          >
            <span className={`${color} text-white text-sm font-semibold px-3 py-1 rounded-full`}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
