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

const gradeColors: Record<number, { bar: string; barBg: string; headerBg: string; headerText: string }> = {
  7:  { bar: "bg-amber-500",  barBg: "bg-amber-100",  headerBg: "bg-amber-50",  headerText: "text-amber-700" },
  8:  { bar: "bg-slate-500",  barBg: "bg-slate-100",  headerBg: "bg-slate-50",  headerText: "text-slate-600" },
  9:  { bar: "bg-yellow-500", barBg: "bg-yellow-100", headerBg: "bg-yellow-50", headerText: "text-yellow-700" },
  10: { bar: "bg-cyan-500",   barBg: "bg-cyan-100",   headerBg: "bg-cyan-50",   headerText: "text-cyan-700" },
  11: { bar: "bg-indigo-500", barBg: "bg-indigo-100", headerBg: "bg-indigo-50", headerText: "text-indigo-700" },
  12: { bar: "bg-red-500",    barBg: "bg-red-100",    headerBg: "bg-red-50",    headerText: "text-red-700" },
};

const logicNames: Record<number, string> = {
  1: "수 일치", 2: "동사 vs 준동사", 3: "능동 vs 수동",
  4: "관계사 vs 접속사", 5: "형용사 vs 부사", 6: "병렬 구조",
  7: "대명사 / 대동사", 8: "조동사 / 가정법", 9: "비교 / 특수구문",
};

const difficultyLabels: Record<string, string> = {
  basic: "기초", intermediate: "중급", advanced: "고급",
};

const difficultyColors: Record<string, string> = {
  basic: "bg-emerald-50 text-emerald-600",
  intermediate: "bg-amber-50 text-amber-600",
  advanced: "bg-rose-50 text-rose-600",
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
      if (!correct) {
        addWrongAnswer(q.id, action.option);
      }
      return {
        ...state,
        selectedOption: action.option,
        isAnswered: true,
        score: correct ? state.score + 1 : state.score,
      };
    }
    case "NEXT": {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, isComplete: true, justCompleted: true };
      }
      return {
        ...state,
        currentIndex: nextIndex,
        selectedOption: null,
        isAnswered: false,
      };
    }
    case "RESET":
      return {
        ...state,
        currentIndex: 0,
        selectedOption: null,
        isAnswered: false,
        score: 0,
        isComplete: false,
      };
    default:
      return state;
  }
}

const initialState: State = {
  questions: [],
  currentIndex: 0,
  selectedOption: null,
  isAnswered: false,
  score: 0,
  isComplete: false,
  justCompleted: false,
  loading: true,
};

export default function QuizPage() {
  const params = useParams();
  const grade = parseInt(params.grade as string);
  const logicNo = parseInt(params.logicNo as string);
  const [state, dispatch] = useReducer(reducer, initialState);
  const gc = gradeColors[grade] || gradeColors[7];

  useEffect(() => {
    if (state.justCompleted) {
      incrementCompletion(grade, logicNo);
    }
  }, [state.justCompleted, grade, logicNo]);

  useEffect(() => {
    async function fetchQuestions() {
      const res = await fetch(`/api/grammar/questions?grade=${grade}&logicNo=${logicNo}`);
      const data = res.ok ? await res.json() : [];

      const diffOrder: Record<string, number> = { basic: 0, intermediate: 1, advanced: 2 };
      const parsed = data
        .map((q: GrammarQuestion) => ({
          ...q,
          options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        }))
        .sort((a: GrammarQuestion, b: GrammarQuestion) => (diffOrder[a.difficulty] ?? 0) - (diffOrder[b.difficulty] ?? 0));
      dispatch({ type: "SET_QUESTIONS", questions: parsed });
    }
    fetchQuestions();
  }, [grade, logicNo]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm">문제를 불러오는 중...</div>
      </div>
    );
  }

  if (state.questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 mb-4 text-sm">문제가 없습니다.</p>
        <Link href={`/grade/${grade}`} className="text-primary-600 hover:underline text-sm">
          돌아가기
        </Link>
      </div>
    );
  }

  if (state.isComplete) {
    const percentage = Math.round((state.score / state.questions.length) * 100);
    return (
      <div className="py-10">
        <div className={`-mx-5 -mt-10 px-5 pt-10 pb-6 mb-6 ${gc.headerBg}`}>
          <p className={`text-xs ${gc.headerText} mb-1`}>{gradeLabels[grade]} · L{logicNo} {logicNames[logicNo]}</p>
          <h2 className="text-xl font-bold text-slate-900">학습 결과</h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center mb-8">
          <div className={`text-4xl font-bold mb-1 ${percentage >= 80 ? "text-emerald-500" : percentage >= 50 ? "text-amber-500" : "text-rose-500"}`}>
            {percentage}%
          </div>
          <div className="text-sm text-slate-500">
            {state.questions.length}문제 중 {state.score}문제 정답
          </div>
        </div>

        <div className="flex gap-2.5 pb-16">
          <button
            onClick={() => dispatch({ type: "RESET" })}
            className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            다시 풀기
          </button>
          <Link
            href={`/grade/${grade}`}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors text-center"
          >
            다른 로직
          </Link>
        </div>

        {/* Floating back */}
        <Link
          href={`/grade/${grade}`}
          className="fixed bottom-6 left-6 w-11 h-11 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all z-50"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </div>
    );
  }

  const question = state.questions[state.currentIndex];
  const progress = ((state.currentIndex + 1) / state.questions.length) * 100;

  return (
    <div>
      {/* Header with grade color */}
      <div className={`-mx-5 -mt-8 px-5 pt-8 pb-4 mb-4 ${gc.headerBg}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium ${gc.headerText}`}>
            {gradeLabels[grade]} · L{logicNo} {logicNames[logicNo]}
          </span>
          <span className="text-xs text-slate-400">
            {state.score}/{state.currentIndex + (state.isAnswered ? 1 : 0)}
          </span>
        </div>

        {/* Progress bar */}
        <div className={`w-full ${gc.barBg} rounded-full h-1.5`}>
          <div
            className={`${gc.bar} h-1.5 rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question number + difficulty */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-slate-800">
          Q{state.currentIndex + 1}
          <span className="text-slate-300 font-normal"> / {state.questions.length}</span>
        </span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${difficultyColors[question.difficulty]}`}>
          {difficultyLabels[question.difficulty]}
        </span>
      </div>

      {/* Question text */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-5">
        <p className="text-slate-800 leading-relaxed text-[15px] whitespace-pre-line">
          {question.question.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block mx-0.5 px-2 py-0.5 bg-primary-50 border-b-2 border-primary-400 rounded text-primary-600 font-medium text-sm">
                  ____
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2 mb-5">
        {question.options.map((option, idx) => {
          const optionNum = idx + 1;
          let style = "bg-white border-slate-200/80 text-slate-800 hover:border-primary-300";

          if (state.isAnswered) {
            if (optionNum === question.answer) {
              style = "bg-emerald-50 border-emerald-400 text-emerald-700";
            } else if (optionNum === state.selectedOption) {
              style = "bg-rose-50 border-rose-400 text-rose-600";
            } else {
              style = "bg-slate-50 border-slate-100 text-slate-300";
            }
          } else if (optionNum === state.selectedOption) {
            style = "bg-primary-50 border-primary-400 text-primary-700";
          }

          return (
            <button
              key={idx}
              onClick={() => dispatch({ type: "SELECT_OPTION", option: optionNum })}
              disabled={state.isAnswered}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-[15px] font-medium transition-all ${style} ${!state.isAnswered ? "cursor-pointer" : "cursor-default"}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {state.isAnswered && (
        <div className={`rounded-xl p-4 mb-4 ${state.selectedOption === question.answer ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
          <div className="mb-1.5">
            {state.selectedOption === question.answer ? (
              <span className="text-emerald-600 text-sm font-semibold">정답!</span>
            ) : (
              <span className="text-rose-500 text-sm font-semibold">
                오답 — 정답: {question.options[question.answer - 1]}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {state.isAnswered && (
        <button
          onClick={() => dispatch({ type: "NEXT" })}
          className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors mb-16"
        >
          {state.currentIndex < state.questions.length - 1 ? "다음 문제" : "결과 보기"}
        </button>
      )}

      {/* Floating back */}
      <Link
        href={`/grade/${grade}`}
        className="fixed bottom-6 left-6 w-11 h-11 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all z-50"
      >
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </div>
  );
}
