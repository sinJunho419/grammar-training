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
  wrongCount: number;
  streak: number;
  status: string;
}

interface DbWrongAnswer {
  id: number;
  user_id: number;
  question_id: number;
  selected_option: number;
  wrong_count: number;
  consecutive_correct: number;
  status: string;
  last_wrong_at: string;
  grammar_questions: {
    id: number;
    grade: number;
    logic_no: number;
    question: string;
    options: string[];
    answer: number;
    explanation: string;
    difficulty: string;
  };
}

function toWrongAnswer(row: DbWrongAnswer): WrongAnswer {
  const q = row.grammar_questions;
  return {
    questionId: q.id,
    grade: q.grade,
    logicNo: q.logic_no,
    question: q.question,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    answer: q.answer,
    selectedOption: row.selected_option,
    explanation: q.explanation,
    difficulty: q.difficulty,
    wrongCount: row.wrong_count,
    streak: row.consecutive_correct,
    status: row.status,
  };
}

export async function getWrongAnswers(): Promise<WrongAnswer[]> {
  const res = await fetch('/api/wrong-answers');
  if (!res.ok) return [];
  const data: DbWrongAnswer[] = await res.json();
  return data.map(toWrongAnswer);
}

export async function getWrongAnswerCount(): Promise<number> {
  const res = await fetch('/api/wrong-answers/count');
  if (!res.ok) return 0;
  const { count } = await res.json();
  return count ?? 0;
}

export async function addWrongAnswer(questionId: number, selectedOption: number): Promise<void> {
  await fetch('/api/wrong-answers/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, selectedOption }),
  });
}

export async function recordCorrectReview(questionId: number): Promise<boolean> {
  const res = await fetch('/api/wrong-answers/correct-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId }),
  });
  const { result } = await res.json();
  return result === 'Mastered';
}

export async function recordWrongReview(questionId: number): Promise<void> {
  await fetch('/api/wrong-answers/wrong-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId }),
  });
}
