import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const TEMP_USER_ID = 1;

export async function POST(req: NextRequest) {
  const { questionId } = await req.json();
  const supabase = await createClient();

  await supabase.rpc("grammar_record_wrong_review", {
    p_user_id: TEMP_USER_ID,
    p_question_id: questionId,
  });

  return NextResponse.json({ ok: true });
}
