"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  WrongAnswer,
  getWrongAnswers,
  recordCorrectReview,
  recordWrongReview,
} from "@/lib/wrong-answers";

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
  basic: "bg-emerald-50 text-emerald-600",
  intermediate: "bg-amber-50 text-amber-600",
  advanced: "bg-rose-50 text-rose-600",
};

type Step = "logic" | "answer" | "result";

type State = {
  questions: WrongAnswer[];
  currentIndex: number;
  step: Step;
  selectedLogic: number | null;
  selectedOption: number | null;
  logicCorrect: boolean;
  answerCorrect: boolean;
  score: number;
  removedCount: number;
  isComplete: boolean;
  loading: boolean;
};

export default function ReviewPage() {
  const [state, setState] = useState<State>({
    questions: [],
    currentIndex: 0,
    step: "logic",
    selectedLogic: null,
    selectedOption: null,
    logicCorrect: false,
    answerCorrect: false,
    score: 0,
    removedCount: 0,
    isComplete: false,
    loading: true,
  });

  const loadQuestions = useCallback(async () => {
    const data = await getWrongAnswers();
    setState((prev) => ({ ...prev, questions: data, loading: false }));
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  function selectLogic(logic: number) {
    if (state.step !== "logic") return;
    const q = state.questions[state.currentIndex];
    const correct = logic === q.logicNo;
    setState((prev) => ({
      ...prev,
      selectedLogic: logic,
      logicCorrect: correct,
      step: "answer",
    }));
  }

  async function selectAnswer(option: number) {
    if (state.step !== "answer") return;
    const q = state.questions[state.currentIndex];
    const answerCorrect = option === q.answer;
    const bothCorrect = state.logicCorrect && answerCorrect;

    let removedCount = state.removedCount;
    if (bothCorrect) {
      const mastered = await recordCorrectReview(q.questionId);
      if (mastered) removedCount += 1;
    } else {
      await recordWrongReview(q.questionId);
    }

    setState((prev) => ({
      ...prev,
      selectedOption: option,
      answerCorrect,
      step: "result",
      score: bothCorrect ? prev.score + 1 : prev.score,
      removedCount,
    }));
  }

  function next() {
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.questions.length) {
      setState((prev) => ({ ...prev, isComplete: true }));
      return;
    }
    setState((prev) => ({
      ...prev,
      currentIndex: nextIndex,
      step: "logic",
      selectedLogic: null,
      selectedOption: null,
      logicCorrect: false,
      answerCorrect: false,
    }));
  }

  async function reset() {
    const fresh = await getWrongAnswers();
    setState({
      questions: fresh,
      currentIndex: 0,
      step: "logic",
      selectedLogic: null,
      selectedOption: null,
      logicCorrect: false,
      answerCorrect: false,
      score: 0,
      removedCount: 0,
      isComplete: false,
      loading: false,
    });
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (state.questions.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-bold text-slate-900 mb-2">오답이 없습니다</h2>
        <p className="text-slate-400 text-sm mb-6">모든 오답을 정복했습니다!</p>
        <Link href="/" className="text-primary-600 text-sm hover:underline">학습하러 가기</Link>
      </div>
    );
  }

  if (state.isComplete) {
    const percentage = Math.round((state.score / state.questions.length) * 100);
    return (
      <div className="py-10">
        <div className="-mx-5 -mt-10 px-5 pt-10 pb-5 mb-6 bg-primary-50">
          <h2 className="text-xl font-bold text-primary-900">복습 결과</h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center mb-8">
          <div className={`text-4xl font-bold mb-1 ${percentage >= 80 ? "text-emerald-500" : percentage >= 50 ? "text-amber-500" : "text-rose-500"}`}>
            {percentage}%
          </div>
          <div className="text-sm text-slate-500 mb-2">
            {state.questions.length}문제 중 {state.score}문제 정답
          </div>
          {state.removedCount > 0 && (
            <div className="text-xs text-emerald-600 font-medium">
              {state.removedCount}문제 졸업!
            </div>
          )}
        </div>

        <div className="flex gap-2.5 pb-16">
          <button
            onClick={reset}
            className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            다시 복습
          </button>
          <Link
            href="/wrong-answers"
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors text-center"
          >
            오답노트로
          </Link>
        </div>

        <Link
          href="/wrong-answers"
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
      {/* Header */}
      <div className="-mx-5 -mt-8 px-5 pt-8 pb-4 mb-4 bg-primary-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-primary-700">오답 복습</span>
          <span className="text-xs text-slate-400">
            {state.score}/{state.currentIndex + (state.step === "result" ? 1 : 0)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-primary-100 rounded-full h-1.5">
          <div
            className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question info */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-semibold text-slate-800">
          Q{state.currentIndex + 1}
          <span className="text-slate-300 font-normal"> / {state.questions.length}</span>
        </span>
        <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
          {gradeLabels[question.grade]}
        </span>
        <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${difficultyColors[question.difficulty]}`}>
          {difficultyLabels[question.difficulty]}
        </span>
        <span className="text-[11px] text-slate-300 ml-auto">
          {question.streak}/3
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

      {/* Step 1: Logic */}
      {state.step === "logic" && (
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
            Step 1 — 로직 선택
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(logicNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => selectLogic(parseInt(key))}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200/80 bg-white text-sm font-medium text-slate-700 hover:border-primary-300 hover:bg-primary-50/50 transition-all cursor-pointer"
              >
                <span className="text-slate-400 mr-2">L{key}</span>{name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Answer */}
      {state.step === "answer" && (
        <div>
          <div className="mb-3">
            <span className={`text-xs font-semibold ${state.logicCorrect ? "text-emerald-600" : "text-rose-500"}`}>
              {state.logicCorrect
                ? `Step 1 정답 — L${state.selectedLogic} ${logicNames[state.selectedLogic!]}`
                : `Step 1 오답 — L${state.selectedLogic} → 정답: L${question.logicNo} ${logicNames[question.logicNo]}`
              }
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
            Step 2 — 정답 선택
          </div>
          <div className="flex flex-col gap-2">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(idx + 1)}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200/80 bg-white text-sm font-medium text-slate-700 hover:border-primary-300 hover:bg-primary-50/50 transition-all cursor-pointer"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {state.step === "result" && (
        <div>
          <div className={`mb-2 text-xs font-semibold ${state.logicCorrect ? "text-emerald-600" : "text-rose-500"}`}>
            Step 1 로직: {state.logicCorrect ? "정답" : "오답"} — L{question.logicNo} {logicNames[question.logicNo]}
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {question.options.map((option, idx) => {
              const optionNum = idx + 1;
              let cls = "bg-slate-50 border-slate-100 text-slate-300";
              if (optionNum === question.answer) {
                cls = "bg-emerald-50 border-emerald-400 text-emerald-700";
              } else if (optionNum === state.selectedOption) {
                cls = "bg-rose-50 border-rose-400 text-rose-600";
              }
              return (
                <div key={idx} className={`px-4 py-3 rounded-xl border-2 text-sm font-medium ${cls}`}>
                  {option}
                </div>
              );
            })}
          </div>

          <div className={`rounded-xl p-4 mb-5 ${state.logicCorrect && state.answerCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
            <div className="text-sm font-semibold mb-2">
              {state.logicCorrect && state.answerCorrect ? (
                <span className="text-emerald-600">로직 + 정답 모두 정답!</span>
              ) : (
                <span className="text-rose-500">
                  {!state.logicCorrect && !state.answerCorrect
                    ? "로직, 정답 모두 오답"
                    : !state.logicCorrect
                    ? "로직 오답"
                    : "정답 오답"}
                  {" "}— 연속 기록 초기화
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{question.explanation}</p>
          </div>

          <button
            onClick={next}
            className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors mb-16"
          >
            {state.currentIndex < state.questions.length - 1 ? "다음 문제" : "결과 보기"}
          </button>
        </div>
      )}

      {/* Floating back */}
      <Link
        href="/wrong-answers"
        className="fixed bottom-6 left-6 w-11 h-11 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all z-50"
      >
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </div>
  );
}
