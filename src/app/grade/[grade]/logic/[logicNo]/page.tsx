"use client";

import { useEffect, useReducer } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GrammarQuestion } from "@/lib/types";
import { addWrongAnswer } from "@/lib/wrong-answers";
import { incrementCompletion } from "@/lib/completion";

const gradeLabels: Record<number, string> = {
  7: "Bronze", 8: "Silver", 9: "Gold", 10: "Platinum", 11: "Diamond", 12: "Grandmaster",
};

const gradeStyles: Record<number, { color: string; light: string; headerBg: string }> = {
  7:  { color: "#b45309", light: "#fef3c7", headerBg: "#fffbeb" },
  8:  { color: "#64748b", light: "#f1f5f9", headerBg: "#f8fafc" },
  9:  { color: "#ca8a04", light: "#fef9c3", headerBg: "#fefce8" },
  10: { color: "#0891b2", light: "#cffafe", headerBg: "#ecfeff" },
  11: { color: "#6366f1", light: "#e0e7ff", headerBg: "#eef2ff" },
  12: { color: "#dc2626", light: "#fee2e2", headerBg: "#fef2f2" },
};

const logicNames: Record<number, string> = {
  1: "수 일치", 2: "동사 vs 준동사", 3: "능동 vs 수동",
  4: "관계사 vs 접속사", 5: "형용사 vs 부사", 6: "병렬 구조",
  7: "대명사 / 대동사", 8: "조동사 / 가정법", 9: "비교 / 특수구문",
};

const difficultyLabels: Record<string, string> = {
  basic: "기초", intermediate: "중급", advanced: "고급",
};

const difficultyStyles: Record<string, { bg: string; color: string }> = {
  basic: { bg: "#ecfdf5", color: "#059669" },
  intermediate: { bg: "#fffbeb", color: "#d97706" },
  advanced: { bg: "#fef2f2", color: "#dc2626" },
};

type State = {
  questions: GrammarQuestion[];
  currentIndex: number;
  selectedOption: number | null;
  isAnswered: boolean;
  score: number;
  isComplete: boolean;
  justCompleted: boolean;
  loading: boolean;
};

type Action =
  | { type: "SET_QUESTIONS"; questions: GrammarQuestion[] }
  | { type: "SELECT_OPTION"; option: number }
  | { type: "NEXT" }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_QUESTIONS":
      return { ...state, questions: action.questions, loading: false };
    case "SELECT_OPTION": {
      if (state.isAnswered) return state;
      const q = state.questions[state.currentIndex];
      const correct = action.option === q.answer;
      if (!correct) addWrongAnswer(q.id, action.option);
      return { ...state, selectedOption: action.option, isAnswered: true, score: correct ? state.score + 1 : state.score };
    }
    case "NEXT": {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) return { ...state, isComplete: true, justCompleted: true };
      return { ...state, currentIndex: nextIndex, selectedOption: null, isAnswered: false };
    }
    case "RESET":
      return { ...state, currentIndex: 0, selectedOption: null, isAnswered: false, score: 0, isComplete: false };
    default:
      return state;
  }
}

const initialState: State = {
  questions: [], currentIndex: 0, selectedOption: null, isAnswered: false,
  score: 0, isComplete: false, justCompleted: false, loading: true,
};

export default function QuizPage() {
  const params = useParams();
  const grade = parseInt(params.grade as string);
  const logicNo = parseInt(params.logicNo as string);
  const [state, dispatch] = useReducer(reducer, initialState);
  const gs = gradeStyles[grade] || gradeStyles[7];

  useEffect(() => {
    if (state.justCompleted) incrementCompletion(grade, logicNo);
  }, [state.justCompleted, grade, logicNo]);

  useEffect(() => {
    async function fetchQuestions() {
      const res = await fetch(`/api/grammar/questions?grade=${grade}&logicNo=${logicNo}`);
      const data = res.ok ? await res.json() : [];
      const diffOrder: Record<string, number> = { basic: 0, intermediate: 1, advanced: 2 };
      const parsed = data
        .map((q: GrammarQuestion) => ({ ...q, options: typeof q.options === "string" ? JSON.parse(q.options) : q.options }))
        .sort((a: GrammarQuestion, b: GrammarQuestion) => (diffOrder[a.difficulty] ?? 0) - (diffOrder[b.difficulty] ?? 0));
      dispatch({ type: "SET_QUESTIONS", questions: parsed });
    }
    fetchQuestions();
  }, [grade, logicNo]);

  if (state.loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-slate-400 text-sm">문제를 불러오는 중...</div></div>;
  }

  if (state.questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 mb-4 text-sm">문제가 없습니다.</p>
        <Link href={`/grade/${grade}`} className="text-primary-600 hover:underline text-sm font-semibold">돌아가기</Link>
      </div>
    );
  }

  if (state.isComplete) {
    const pct = Math.round((state.score / state.questions.length) * 100);
    return (
      <div className="py-6">
        <div className="-mx-5 -mt-6 px-6 pt-8 pb-6 mb-6 rounded-b-[24px]" style={{ backgroundColor: gs.headerBg }}>
          <p className="text-xs font-bold mb-1" style={{ color: gs.color }}>{gradeLabels[grade]} · L{logicNo} {logicNames[logicNo]}</p>
          <h2 className="text-xl font-extrabold text-[#2d3436]">학습 결과</h2>
        </div>

        <div className="bg-white rounded-[20px] border border-[#edf2f7] shadow-[0_10px_25px_rgba(0,0,0,0.03)] p-8 text-center mb-6">
          <div className={`text-5xl font-extrabold mb-2 ${pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-rose-500"}`}>{pct}%</div>
          <div className="text-sm text-slate-400 font-medium">{state.questions.length}문제 중 {state.score}문제 정답</div>
        </div>

        <div className="flex gap-3 pb-20">
          <button onClick={() => dispatch({ type: "RESET" })} className="flex-1 py-3.5 rounded-[14px] text-sm font-bold text-white transition-colors" style={{ backgroundColor: gs.color }}>
            다시 풀기
          </button>
          <Link href={`/grade/${grade}`} className="flex-1 py-3.5 bg-white border border-[#edf2f7] text-slate-600 rounded-[14px] text-sm font-bold hover:bg-slate-50 transition-colors text-center">
            다른 로직
          </Link>
        </div>

        <Link href={`/grade/${grade}`} className="fixed bottom-6 left-6 w-12 h-12 bg-white border border-[#edf2f7] rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex items-center justify-center hover:-translate-y-1 active:scale-90 transition-all duration-300 z-50">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
      </div>
    );
  }

  const question = state.questions[state.currentIndex];
  const progress = ((state.currentIndex + 1) / state.questions.length) * 100;
  const ds = difficultyStyles[question.difficulty];

  return (
    <div>
      {/* Header */}
      <div className="-mx-5 -mt-8 px-6 pt-8 pb-4 mb-5 rounded-b-[24px]" style={{ backgroundColor: gs.headerBg }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold" style={{ color: gs.color }}>
            {gradeLabels[grade]} · L{logicNo} {logicNames[logicNo]}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {state.score}/{state.currentIndex + (state.isAnswered ? 1 : 0)}
          </span>
        </div>
        <div className="w-full rounded-full h-2" style={{ backgroundColor: gs.light }}>
          <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: gs.color }} />
        </div>
      </div>

      {/* Question number + difficulty */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-base font-extrabold text-[#2d3436]">
          Q{state.currentIndex + 1}
          <span className="text-slate-300 font-semibold"> / {state.questions.length}</span>
        </span>
        <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: ds.bg, color: ds.color }}>
          {difficultyLabels[question.difficulty]}
        </span>
      </div>

      {/* Question */}
      <div className="bg-white rounded-[20px] border border-[#edf2f7] shadow-[0_10px_25px_rgba(0,0,0,0.03)] p-5 mb-5">
        <p className="text-[#2d3436] leading-relaxed text-[15px] whitespace-pre-line font-medium">
          {question.question.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block mx-0.5 px-2.5 py-0.5 rounded-lg text-sm font-bold" style={{ backgroundColor: gs.light, color: gs.color, borderBottom: `2px solid ${gs.color}` }}>
                  ____
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5 mb-5">
        {question.options.map((option, idx) => {
          const optionNum = idx + 1;
          let cls = "bg-white border-[#edf2f7] text-[#2d3436] hover:border-primary-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]";

          if (state.isAnswered) {
            if (optionNum === question.answer) {
              cls = "bg-emerald-50 border-emerald-400 text-emerald-700";
            } else if (optionNum === state.selectedOption) {
              cls = "bg-rose-50 border-rose-400 text-rose-600";
            } else {
              cls = "bg-slate-50 border-[#edf2f7] text-slate-300";
            }
          } else if (optionNum === state.selectedOption) {
            cls = "bg-primary-50 border-primary-400 text-primary-700";
          }

          return (
            <button
              key={idx}
              onClick={() => dispatch({ type: "SELECT_OPTION", option: optionNum })}
              disabled={state.isAnswered}
              className={`w-full text-left px-5 py-3.5 rounded-[14px] border-2 text-[15px] font-semibold transition-all duration-200 ${cls} ${!state.isAnswered ? "cursor-pointer" : "cursor-default"}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {state.isAnswered && (
        <div className={`rounded-[20px] p-5 mb-4 border ${state.selectedOption === question.answer ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
          <div className="mb-2">
            {state.selectedOption === question.answer ? (
              <span className="text-emerald-600 text-sm font-bold">정답!</span>
            ) : (
              <span className="text-rose-500 text-sm font-bold">오답 — 정답: {question.options[question.answer - 1]}</span>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {/* Next */}
      {state.isAnswered && (
        <button
          onClick={() => dispatch({ type: "NEXT" })}
          className="w-full py-3.5 text-white rounded-[14px] text-sm font-bold transition-colors mb-20"
          style={{ backgroundColor: gs.color }}
        >
          {state.currentIndex < state.questions.length - 1 ? "다음 문제" : "결과 보기"}
        </button>
      )}

      {/* Floating back */}
      <Link
        href={`/grade/${grade}`}
        className="fixed bottom-6 left-6 w-12 h-12 bg-white border border-[#edf2f7] rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex items-center justify-center hover:-translate-y-1 active:scale-90 transition-all duration-300 z-50"
      >
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </div>
  );
}
