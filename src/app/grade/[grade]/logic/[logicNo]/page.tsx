"use client";

import { useEffect, useReducer } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { GrammarQuestion } from "@/lib/types";
import { addWrongAnswer } from "@/lib/wrong-answers";
import { incrementCompletion } from "@/lib/completion";

const gradeLabels: Record<number, string> = {
  7: "Bronze", 8: "Silver", 9: "Gold", 10: "Platinum", 11: "Diamond", 12: "Grandmaster",
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
  basic: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
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

  useEffect(() => {
    if (state.justCompleted) {
      incrementCompletion(grade, logicNo);
    }
  }, [state.justCompleted, grade, logicNo]);

  useEffect(() => {
    async function fetchQuestions() {
      const { data } = await supabase
        .from("grammar_questions")
        .select("*")
        .eq("grade", grade)
        .eq("logic_no", logicNo)
        .order("difficulty")
        .order("module_no");

      if (data) {
        const diffOrder: Record<string, number> = { basic: 0, intermediate: 1, advanced: 2 };
        const parsed = data
          .map((q) => ({
            ...q,
            options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
          }))
          .sort((a, b) => (diffOrder[a.difficulty] ?? 0) - (diffOrder[b.difficulty] ?? 0));
        dispatch({ type: "SET_QUESTIONS", questions: parsed });
      }
    }
    fetchQuestions();
  }, [grade, logicNo]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">문제를 불러오는 중...</div>
      </div>
    );
  }

  if (state.questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">문제가 없습니다.</p>
        <Link href={`/grade/${grade}`} className="text-blue-600 hover:underline">
          돌아가기
        </Link>
      </div>
    );
  }

  if (state.isComplete) {
    const percentage = Math.round((state.score / state.questions.length) * 100);
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">학습 결과</h2>
        <p className="text-gray-500 mb-6">
          {gradeLabels[grade]} &middot; L{logicNo} {logicNames[logicNo]}
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
          <div className={`text-5xl font-bold mb-2 ${percentage >= 80 ? "text-emerald-500" : percentage >= 50 ? "text-yellow-500" : "text-red-500"}`}>
            {percentage}%
          </div>
          <div className="text-gray-600">
            총 {state.questions.length}문제 중 {state.score}문제 정답
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => dispatch({ type: "RESET" })}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            다시 풀기
          </button>
          <Link
            href={`/grade/${grade}`}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            다른 로직 선택
          </Link>
        </div>
      </div>
    );
  }

  const question = state.questions[state.currentIndex];
  const progress = ((state.currentIndex + 1) / state.questions.length) * 100;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-700 font-medium">
          {gradeLabels[grade]} L{logicNo} ({logicNames[logicNo]})
        </span>
        <span className="text-sm text-gray-500">
          {state.score}정답 / {state.currentIndex + (state.isAnswered ? 1 : 0)}문제
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question number + difficulty */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-700">
          문제 {state.currentIndex + 1} / {state.questions.length}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[question.difficulty]}`}>
          {difficultyLabels[question.difficulty]}
        </span>
      </div>

      {/* Question text */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
        <p className="text-gray-900 leading-relaxed whitespace-pre-line">
          {question.question.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block mx-1 px-3 py-0.5 bg-blue-50 border-b-2 border-blue-400 rounded text-blue-600 font-medium">
                  ____
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2 mb-4">
        {question.options.map((option, idx) => {
          const optionNum = idx + 1;
          let btnClass = "bg-white border-gray-200 hover:border-blue-300 text-gray-900";

          if (state.isAnswered) {
            if (optionNum === question.answer) {
              btnClass = "bg-emerald-50 border-emerald-500 text-emerald-700";
            } else if (optionNum === state.selectedOption) {
              btnClass = "bg-red-50 border-red-500 text-red-700";
            } else {
              btnClass = "bg-gray-50 border-gray-200 text-gray-400";
            }
          } else if (optionNum === state.selectedOption) {
            btnClass = "bg-blue-50 border-blue-400 text-blue-700";
          }

          return (
            <button
              key={idx}
              onClick={() => dispatch({ type: "SELECT_OPTION", option: optionNum })}
              disabled={state.isAnswered}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${btnClass} ${!state.isAnswered ? "cursor-pointer" : "cursor-default"}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {state.isAnswered && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            {state.selectedOption === question.answer ? (
              <span className="text-emerald-600 font-bold">정답!</span>
            ) : (
              <span className="text-red-600 font-bold">
                오답! 정답은 {question.options[question.answer - 1]}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {state.isAnswered && (
        <button
          onClick={() => dispatch({ type: "NEXT" })}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          {state.currentIndex < state.questions.length - 1 ? "다음 문제" : "결과 보기"}
        </button>
      )}

      {/* 돌아가기 */}
      <div className="mt-6 text-center">
        <Link href={`/grade/${grade}`} className="inline-block px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors">
          돌아가기
        </Link>
      </div>
    </div>
  );
}
