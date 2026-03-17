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
  basic: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
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
        <div className="text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  if (state.questions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">&#10024;</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">오답이 없습니다</h2>
        <p className="text-gray-500 mb-6">모든 오답을 정복했습니다!</p>
        <Link href="/" className="text-blue-600 hover:underline">학습하러 가기</Link>
      </div>
    );
  }

  if (state.isComplete) {
    const percentage = Math.round((state.score / state.questions.length) * 100);
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">복습 결과</h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
          <div className={`text-5xl font-bold mb-2 ${percentage >= 80 ? "text-emerald-500" : percentage >= 50 ? "text-yellow-500" : "text-red-500"}`}>
            {percentage}%
          </div>
          <div className="text-gray-600 mb-2">
            총 {state.questions.length}문제 중 {state.score}문제 정답
          </div>
          {state.removedCount > 0 && (
            <div className="text-emerald-600 font-medium">
              {state.removedCount}문제 오답노트에서 졸업!
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            다시 복습
          </button>
          <Link
            href="/wrong-answers"
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            오답노트로
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
        <Link href="/wrong-answers" className="text-sm text-blue-600 hover:underline">
          &larr; 오답노트
        </Link>
        <span className="text-sm text-gray-500">
          {state.score}정답 / {state.currentIndex + (state.step === "result" ? 1 : 0)}문제
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question info */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-700">
          문제 {state.currentIndex + 1} / {state.questions.length}
        </span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          {gradeLabels[question.grade]}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[question.difficulty]}`}>
          {difficultyLabels[question.difficulty]}
        </span>
        <span className="text-xs text-gray-400">
          연속 {question.streak}/3
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

      {/* Step 1: 로직 선택 */}
      {state.step === "logic" && (
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-3">
            STEP 1: 이 문제에 해당하는 로직은?
          </div>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(logicNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => selectLogic(parseInt(key))}
                className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 bg-white font-medium hover:border-blue-300 transition-all cursor-pointer"
              >
                L{key} {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: 정답 선택 */}
      {state.step === "answer" && (
        <div>
          <div className="mb-3">
            <span className={`text-sm font-semibold ${state.logicCorrect ? "text-emerald-600" : "text-red-600"}`}>
              {state.logicCorrect
                ? `STEP 1 정답! (L${state.selectedLogic} ${logicNames[state.selectedLogic!]})`
                : `STEP 1 오답! 선택: L${state.selectedLogic} ${logicNames[state.selectedLogic!]} → 정답: L${question.logicNo} ${logicNames[question.logicNo]}`
              }
            </span>
          </div>
          <div className="text-sm font-semibold text-gray-700 mb-3">
            STEP 2: 정답을 선택하세요
          </div>
          <div className="flex flex-col gap-2">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(idx + 1)}
                className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 bg-white font-medium hover:border-blue-300 transition-all cursor-pointer"
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
          {/* Logic result */}
          <div className={`mb-2 text-sm font-semibold ${state.logicCorrect ? "text-emerald-600" : "text-red-600"}`}>
            STEP 1 로직: {state.logicCorrect ? "정답" : "오답"} (L{question.logicNo} {logicNames[question.logicNo]})
          </div>

          {/* Answer result with options */}
          <div className="flex flex-col gap-2 mb-4">
            {question.options.map((option, idx) => {
              const optionNum = idx + 1;
              let btnClass = "bg-gray-50 border-gray-200 text-gray-400";
              if (optionNum === question.answer) {
                btnClass = "bg-emerald-50 border-emerald-500 text-emerald-700";
              } else if (optionNum === state.selectedOption) {
                btnClass = "bg-red-50 border-red-500 text-red-700";
              }
              return (
                <div key={idx} className={`px-4 py-3 rounded-xl border-2 font-medium ${btnClass}`}>
                  {option}
                </div>
              );
            })}
          </div>

          {/* Overall result */}
          <div className={`rounded-2xl p-5 mb-4 ${state.logicCorrect && state.answerCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
            <div className="font-bold mb-2">
              {state.logicCorrect && state.answerCorrect ? (
                <span className="text-emerald-600">로직 + 정답 모두 정답!</span>
              ) : (
                <span className="text-red-600">
                  {!state.logicCorrect && !state.answerCorrect
                    ? "로직, 정답 모두 오답"
                    : !state.logicCorrect
                    ? "로직 오답"
                    : "정답 오답"}
                  — 연속 기록 초기화
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
          </div>

          {/* Next */}
          <button
            onClick={next}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            {state.currentIndex < state.questions.length - 1 ? "다음 문제" : "결과 보기"}
          </button>
        </div>
      )}
    </div>
  );
}
