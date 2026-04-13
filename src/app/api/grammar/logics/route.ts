import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const grade = req.nextUrl.searchParams.get("grade");
  if (!grade) return NextResponse.json([], { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grammar_logics")
    .select("*")
    .lte("min_grade", parseInt(grade))
    .order("logic_no");

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data);
}
