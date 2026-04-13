import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const grade = req.nextUrl.searchParams.get("grade");
  const logicNo = req.nextUrl.searchParams.get("logicNo");
  if (!grade || !logicNo) return NextResponse.json([], { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grammar_questions")
    .select("*")
    .eq("grade", parseInt(grade))
    .eq("logic_no", parseInt(logicNo))
    .order("difficulty")
    .order("module_no");

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data);
}
