import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

export default async function GradePage({
  params,
}: {
  params: Promise<{ grade: string }>;
}) {
  const { grade: gradeStr } = await params;
  const grade = parseInt(gradeStr);
  const label = gradeLabels[grade] || `Grade ${grade}`;

  const { data: logics } = await supabase
    .from("grammar_logics")
    .select("*")
    .lte("min_grade", grade)
    .order("logic_no");

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {label}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(logics || []).map((logic) => (
          <Link
            key={logic.logic_no}
            href={`/grade/${grade}/logic/${logic.logic_no}`}
            className="flex flex-col items-center justify-center rounded-xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className="text-blue-600 font-bold text-lg mb-1">
              L{logic.logic_no}
            </div>
            <div className="text-sm font-semibold text-gray-900 text-center">
              {logicNames[logic.logic_no] || logic.name}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="inline-block px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors">
          돌아가기
        </Link>
      </div>
    </div>
  );
}
