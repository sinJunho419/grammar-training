import { supabase } from './supabase';

// TODO: 로그인 연동 후 실제 user_id로 교체
const TEMP_USER_ID = 1;

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
  streak: number; // consecutive_correct
  status: string; // 'Learning' | 'Mastered'
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
  const { data, error } = await supabase
    .from('grammar_wrong_answers')
    .select(`
      id, user_id, question_id, selected_option,
      wrong_count, consecutive_correct, status, last_wrong_at,
      grammar_questions (
        id, grade, logic_no, question, options, answer, explanation, difficulty
      )
    `)
    .eq('user_id', TEMP_USER_ID)
    .eq('status', 'Learning')
    .order('last_wrong_at', { ascending: false });

  if (error || !data) return [];
  return (data as unknown as DbWrongAnswer[]).map(toWrongAnswer);
}

export async function getWrongAnswerCount(): Promise<number> {
  const { count, error } = await supabase
    .from('grammar_wrong_answers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', TEMP_USER_ID)
    .eq('status', 'Learning');

  if (error) return 0;
  return count ?? 0;
}

export async function addWrongAnswer(questionId: number, selectedOption: number): Promise<void> {
  await supabase.rpc('grammar_increment_wrong', {
    p_user_id: TEMP_USER_ID,
    p_question_id: questionId,
    p_selected_option: selectedOption,
  });
}

export async function recordCorrectReview(questionId: number): Promise<boolean> {
  const { data } = await supabase.rpc('grammar_record_correct_review', {
    p_user_id: TEMP_USER_ID,
    p_question_id: questionId,
  });

  return data === 'Mastered';
}

export async function recordWrongReview(questionId: number): Promise<void> {
  await supabase.rpc('grammar_record_wrong_review', {
    p_user_id: TEMP_USER_ID,
    p_question_id: questionId,
  });
}
