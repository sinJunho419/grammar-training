const STORAGE_KEY_PREFIX = "grammar_complete";

function getKey(grade: number, logicNo: number) {
  return `${STORAGE_KEY_PREFIX}_${grade}_${logicNo}`;
}

export function getCompletionCount(grade: number, logicNo: number): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(getKey(grade, logicNo)) || "0", 10);
}

export function incrementCompletion(grade: number, logicNo: number): number {
  const count = getCompletionCount(grade, logicNo) + 1;
  localStorage.setItem(getKey(grade, logicNo), String(count));
  return count;
}

export function getAllCompletions(grade: number, logicNos: number[]): Record<number, number> {
  const result: Record<number, number> = {};
  for (const no of logicNos) {
    result[no] = getCompletionCount(grade, no);
  }
  return result;
}
