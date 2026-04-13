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

type AnswerState = {
  step: Step;
  selectedLogic: number | null;
  selectedOption: number | null;
  logicCorrect: boolean;
  answerCorrect: boolean;
};

const initialAnswerState: AnswerState = {
  step: "logic",
  selectedLogic: null,
  selectedOption: null,
  logicCorrect: false,
  answerCorrect: false,
};

export default function WrongAnswersPage() {
  const [items, setItems] = useState<WrongAnswer[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [answerStates, setAnswerStates] = useState<Record<number, AnswerState>>({});
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedLogic, setSelectedLogic] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    const data = await getWrongAnswers();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filtered = items.filter((item) => {
    if (selectedGrade && item.grade !== selectedGrade) return false;
    if (selectedLogic && item.logicNo !== selectedLogic) return false;
    return true;
  });

  const grades = [...new Set(items.map((i) => i.grade))].sort();

  function getState(id: number): AnswerState {
    return answerStates[id] || initialAnswerState;
  }

  function updateState(id: number, patch: Partial<AnswerState>) {
    setAnswerStates((prev) => ({
      ...prev,
      [id]: { ...getState(id), ...patch },
    }));
  }

  function handleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setAnswerStates((prev) => ({ ...prev, [id]: initialAnswerState }));
    }
  }

  function handleLogicNext(item: WrongAnswer) {
    const st = getState(item.questionId);
    if (st.selectedLogic === null) return;
    updateState(item.questionId, { step: "answer" });
  }

  async function handleSubmit(item: WrongAnswer) {
    const st = getState(item.questionId);
    if (st.selectedOption === null) return;

    const logicCorrect = st.selectedLogic === item.logicNo;
    const answerCorrect = st.selectedOption === item.answer;
    const bothCorrect = logicCorrect && answerCorrect;

    if (bothCorrect) {
      const mastered = await recordCorrectReview(item.questionId);
      if (mastered) {
        setTimeout(() => {
          loadItems();
          setExpandedId(null);
        }, 1500);
      } else {
        await loadItems();
      }
    } else {
      await recordWrongReview(item.questionId);
      await loadItems();
    }

    updateState(item.questionId, {
      step: "result",
      logicCorrect,
      answerCorrect,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-bold text-slate-900 mb-2">오답이 없습니다</h2>
        <p className="text-slate-400 text-sm mb-6">문제를 풀고 틀린 문제가 여기에 기록됩니다.</p>
        <Link href="/" className="text-primary-600 text-sm hover:underline">학습하러 가기</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="-mx-5 -mt-8 px-5 pt-8 pb-5 mb-5 bg-primary-50">
        <h1 className="text-xl font-bold text-primary-900">오답노트</h1>
        <p className="text-primary-500 text-xs mt-1">로직+정답 연속 3회 정답 시 자동 졸업</p>
      </div>

      {/* Review button */}
      <Link
        href="/wrong-answers/review"
        className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors mb-5"
      >
        오답 연속 풀기 ({items.length}문제)
      </Link>

      {/* Filters */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button
          onClick={() => { setSelectedGrade(null); setSelectedLogic(null); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !selectedGrade && !selectedLogic
              ? "bg-primary-600 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          전체
        </button>
        {grades.map((g) => (
          <button
            key={g}
            onClick={() => { setSelectedGrade(g === selectedGrade ? null : g); setSelectedLogic(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedGrade === g
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {gradeLabels[g]}
          </button>
        ))}
      </div>

      {/* Wrong answer list */}
      <div className="flex flex-col gap-2.5 pb-16">
        {filtered.map((item) => {
          const st = getState(item.questionId);
          return (
            <div key={item.questionId} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
              <button
                onClick={() => handleExpand(item.questionId)}
                className="w-full text-left p-4"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                    {gradeLabels[item.grade]}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${difficultyColors[item.difficulty]}`}>
                    {difficultyLabels[item.difficulty]}
                  </span>
                  <span className="text-[11px] text-slate-300 ml-auto">
                    {item.streak ?? 0}/3
                  </span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">{item.question}</p>
              </button>

              {expandedId === item.questionId && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">

                  {/* STEP 1: Logic */}
                  {st.step === "logic" && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-2 block">
                        이 문제의 로직은?
                      </label>
                      <select
                        value={st.selectedLogic ?? ""}
                        onChange={(e) => updateState(item.questionId, { selectedLogic: parseInt(e.target.value) || null })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-primary-400 focus:outline-none mb-3"
                      >
                        <option value="">로직을 선택하세요</option>
                        {Object.entries(logicNames).map(([key, name]) => (
                          <option key={key} value={key}>L{key} {name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleLogicNext(item)}
                        disabled={st.selectedLogic === null}
                        className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  )}

                  {/* STEP 2: Answer */}
                  {st.step === "answer" && (
                    <div>
                      <div className="text-xs text-slate-400 mb-3">
                        선택한 로직: <span className="font-semibold text-slate-600">L{st.selectedLogic} {logicNames[st.selectedLogic!]}</span>
                      </div>
                      <label className="text-xs font-semibold text-slate-600 mb-2 block">
                        정답을 선택하세요
                      </label>
                      <div className="flex flex-col gap-2 mb-3">
                        {item.options.map((option, idx) => {
                          const optionNum = idx + 1;
                          const selected = optionNum === st.selectedOption;
                          return (
                            <button
                              key={idx}
                              onClick={() => updateState(item.questionId, { selectedOption: optionNum })}
                              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                                selected
                                  ? "border-primary-400 bg-primary-50 text-primary-700"
                                  : "border-slate-200/80 bg-white text-slate-700 hover:border-primary-300"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => handleSubmit(item)}
                        disabled={st.selectedOption === null}
                        className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        제출
                      </button>
                    </div>
                  )}

                  {/* STEP 3: Result */}
                  {st.step === "result" && (
                    <div>
                      <div className="flex flex-col gap-2 mb-4">
                        {item.options.map((option, idx) => {
                          const optionNum = idx + 1;
                          let cls = "border-slate-100 bg-slate-50 text-slate-300";
                          if (optionNum === item.answer) {
                            cls = "border-emerald-400 bg-emerald-50 text-emerald-700";
                          } else if (optionNum === st.selectedOption) {
                            cls = "border-rose-400 bg-rose-50 text-rose-600";
                          }
                          return (
                            <div key={idx} className={`px-4 py-3 rounded-xl border-2 text-sm font-medium ${cls}`}>
                              {option}
                            </div>
                          );
                        })}
                      </div>

                      <div className={`rounded-xl p-3 mb-3 ${st.logicCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
                        <div className={`text-xs font-semibold ${st.logicCorrect ? "text-emerald-600" : "text-rose-500"}`}>
                          로직 {st.logicCorrect ? "정답" : "오답"}{!st.logicCorrect && " — 연속 기록 초기화"}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          선택: L{st.selectedLogic} {logicNames[st.selectedLogic!]}
                        </div>
                        {!st.logicCorrect && (
                          <div className="text-xs text-emerald-600 mt-0.5">
                            정답: L{item.logicNo} {logicNames[item.logicNo]}
                          </div>
                        )}
                      </div>

                      <div className={`rounded-xl p-4 ${st.logicCorrect && st.answerCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
                        {st.logicCorrect && st.answerCorrect ? (
                          <div className="text-emerald-600 text-sm font-semibold mb-2">
                            로직 + 선지 모두 정답!
                          </div>
                        ) : (
                          <div className="mb-2">
                            <div className={`text-xs font-semibold ${st.answerCorrect ? "text-emerald-600" : "text-rose-500"}`}>
                              선지 {st.answerCorrect ? "정답" : "오답"}{!st.answerCorrect && " — 연속 기록 초기화"}
                            </div>
                            {!st.answerCorrect && (
                              <div className="text-xs text-emerald-600 mt-0.5">
                                정답: {item.options[item.answer - 1]}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-slate-600 leading-relaxed mt-2">{item.explanation}</p>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating back */}
      <Link
        href="/"
        className="fixed bottom-6 left-6 w-11 h-11 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all z-50"
      >
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
    </div>
  );
}
