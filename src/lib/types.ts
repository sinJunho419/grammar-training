export interface GrammarLogic {
  logic_no: number;
  name: string;
  description: string;
  min_grade: number;
}

export interface GrammarQuestion {
  id: number;
  grade: number;
  logic_no: number;
  module_no: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}
