import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const TEMP_USER_ID = 1;

export async function POST(req: NextRequest) {
  const { questionId, selectedOption } = await req.json();
  const supabase = await createClient();

  await supabase.rpc("grammar_increment_wrong", {
    p_user_id: TEMP_USER_ID,
    p_question_id: questionId,
    p_selected_option: selectedOption,
  });

  return NextResponse.json({ ok: true });
}
