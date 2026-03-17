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
        <div className="text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">&#10024;</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">오답이 없습니다</h2>
        <p className="text-gray-500 mb-6">문제를 풀고 틀린 문제가 여기에 기록됩니다.</p>
        <Link href="/" className="text-blue-600 hover:underline">학습하러 가기</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">&larr; 홈</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">오답노트</h1>
        <p className="text-gray-500 text-sm">틀린 문제 {items.length}개 (로직+정답 연속 3회 정답 시 자동 졸업)</p>
      </div>

      {/* 오답 다시 풀기 버튼 */}
      <Link
        href="/wrong-answers/review"
        className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors mb-6"
      >
        오답 연속 풀기 ({items.length}문제)
      </Link>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => { setSelectedGrade(null); setSelectedLogic(null); }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !selectedGrade && !selectedLogic
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        {grades.map((g) => (
          <button
            key={g}
            onClick={() => { setSelectedGrade(g === selectedGrade ? null : g); setSelectedLogic(null); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedGrade === g
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {gradeLabels[g]}
          </button>
        ))}
      </div>

      {/* Wrong answer list */}
      <div className="flex flex-col gap-3">
        {filtered.map((item) => {
          const st = getState(item.questionId);
          return (
            <div key={item.questionId} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => handleExpand(item.questionId)}
                className="w-full text-left p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {gradeLabels[item.grade]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[item.difficulty]}`}>
                    {difficultyLabels[item.difficulty]}
                  </span>
                  <span className="text-xs text-gray-400">
                    연속 {item.streak ?? 0}/3
                  </span>
                </div>
                <p className="text-sm text-gray-900 line-clamp-2">{item.question}</p>
              </button>

              {expandedId === item.questionId && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">

                  {/* STEP 1: 로직 선택 */}
                  {st.step === "logic" && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">
                        이 문제의 로직은?
                      </label>
                      <select
                        value={st.selectedLogic ?? ""}
                        onChange={(e) => updateState(item.questionId, { selectedLogic: parseInt(e.target.value) || null })}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium focus:border-blue-400 focus:outline-none mb-3"
                      >
                        <option value="">로직을 선택하세요</option>
                        {Object.entries(logicNames).map(([key, name]) => (
                          <option key={key} value={key}>L{key} {name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleLogicNext(item)}
                        disabled={st.selectedLogic === null}
                        className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  )}

                  {/* STEP 2: 선지 선택 */}
                  {st.step === "answer" && (
                    <div>
                      <div className="text-sm text-gray-500 mb-3">
                        선택한 로직: <span className="font-semibold text-gray-700">L{st.selectedLogic} {logicNames[st.selectedLogic!]}</span>
                      </div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">
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
                              className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all cursor-pointer ${
                                selected
                                  ? "border-blue-400 bg-blue-50 text-blue-700"
                                  : "border-gray-200 bg-white text-gray-900 hover:border-blue-300"
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
                        className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        제출
                      </button>
                    </div>
                  )}

                  {/* STEP 3: 결과 */}
                  {st.step === "result" && (
                    <div>
                      {/* 선지 표시 */}
                      <div className="flex flex-col gap-2 mb-4">
                        {item.options.map((option, idx) => {
                          const optionNum = idx + 1;
                          let btnClass = "border-gray-200 bg-gray-50 text-gray-400";
                          if (optionNum === item.answer) {
                            btnClass = "border-emerald-500 bg-emerald-50 text-emerald-700";
                          } else if (optionNum === st.selectedOption) {
                            btnClass = "border-red-500 bg-red-50 text-red-700";
                          }
                          return (
                            <div key={idx} className={`px-4 py-3 rounded-xl border-2 font-medium ${btnClass}`}>
                              {option}
                            </div>
                          );
                        })}
                      </div>

                      {/* 로직 결과 */}
                      <div className={`rounded-xl p-3 mb-3 ${st.logicCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                        <div className={`text-sm font-semibold ${st.logicCorrect ? "text-emerald-600" : "text-red-600"}`}>
                          로직 {st.logicCorrect ? "정답" : "오답"}{!st.logicCorrect && " (연속 기록 초기화)"}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          내 선택: <span className="font-medium">L{st.selectedLogic} {logicNames[st.selectedLogic!]}</span>
                        </div>
                        {!st.logicCorrect && (
                          <div className="text-sm text-emerald-700 mt-0.5">
                            정답: <span className="font-medium">L{item.logicNo} {logicNames[item.logicNo]}</span>
                          </div>
                        )}
                      </div>

                      {/* 선지 결과 + 해설 */}
                      <div className={`rounded-2xl p-4 ${st.logicCorrect && st.answerCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                        {st.logicCorrect && st.answerCorrect ? (
                          <div className="text-emerald-600 font-bold mb-2">
                            로직 + 선지 모두 정답!
                          </div>
                        ) : (
                          <div className="mb-2">
                            <div className={`text-sm font-semibold ${st.answerCorrect ? "text-emerald-600" : "text-red-600"}`}>
                              선지 {st.answerCorrect ? "정답" : "오답"}{!st.answerCorrect && " (연속 기록 초기화)"}
                            </div>
                            {!st.answerCorrect && (
                              <div className="text-sm text-emerald-700 mt-0.5">
                                정답: <span className="font-medium">{item.options[item.answer - 1]}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray-700 leading-relaxed mt-2">{item.explanation}</p>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
