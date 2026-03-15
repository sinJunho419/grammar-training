export interface WrongAnswer {
  questionId: number;
  grade: number;
  logicNo: number;
  question: string;
  options: string[];
  answer: number;
  selectedOption: number;
  explanation: string;
  difficulty: string;
  timestamp: number;
  streak: number; // 연속 정답 횟수 (로직+정답 모두 맞춘 횟수)
}

const STORAGE_KEY = "grammar_wrong_answers";

export function getWrongAnswers(): WrongAnswer[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw).map((w: WrongAnswer) => ({
    ...w,
    streak: w.streak ?? 0,
  }));
}

function saveWrongAnswers(list: WrongAnswer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addWrongAnswer(item: WrongAnswer) {
  const list = getWrongAnswers();
  const idx = list.findIndex((w) => w.questionId === item.questionId);
  if (idx === -1) {
    list.push({ ...item, streak: 0 });
  } else {
    // 다시 틀리면 streak 리셋
    list[idx].streak = 0;
    list[idx].selectedOption = item.selectedOption;
    list[idx].timestamp = item.timestamp;
  }
  saveWrongAnswers(list);
}

// 오답노트 복습에서 로직+정답 모두 맞춘 경우
export function recordCorrectReview(questionId: number): boolean {
  const list = getWrongAnswers();
  const idx = list.findIndex((w) => w.questionId === questionId);
  if (idx === -1) return false;

  list[idx].streak += 1;
  if (list[idx].streak >= 3) {
    list.splice(idx, 1);
    saveWrongAnswers(list);
    return true; // 삭제됨
  }
  saveWrongAnswers(list);
  return false;
}

// 오답노트 복습에서 틀린 경우 (로직 또는 정답)
export function recordWrongReview(questionId: number) {
  const list = getWrongAnswers();
  const idx = list.findIndex((w) => w.questionId === questionId);
  if (idx !== -1) {
    list[idx].streak = 0;
    saveWrongAnswers(list);
  }
}

export function removeWrongAnswer(questionId: number) {
  const list = getWrongAnswers().filter((w) => w.questionId !== questionId);
  saveWrongAnswers(list);
}

export function getWrongAnswerCount(): number {
  return getWrongAnswers().length;
}
