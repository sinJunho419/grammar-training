import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const TEMP_USER_ID = 1;

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grammar_wrong_answers")
    .select(`
      id, user_id, question_id, selected_option,
      wrong_count, consecutive_correct, status, last_wrong_at,
      grammar_questions (
        id, grade, logic_no, question, options, answer, explanation, difficulty
      )
    `)
    .eq("user_id", TEMP_USER_ID)
    .eq("status", "Learning")
    .order("last_wrong_at", { ascending: false });

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data);
}
