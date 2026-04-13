import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const TEMP_USER_ID = 1;

export async function GET() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("grammar_wrong_answers")
    .select("*", { count: "exact", head: true })
    .eq("user_id", TEMP_USER_ID)
    .eq("status", "Learning");

  if (error) return NextResponse.json({ count: 0 });
  return NextResponse.json({ count: count ?? 0 });
}
