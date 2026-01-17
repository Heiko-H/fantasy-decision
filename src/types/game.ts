export interface Answer {
  id: string;
  text: string;
  nextQuestionId: string;
}

export interface Question {
  id: string;
  story: string;
  questionText: string;
  answers: Answer[];
}

export interface Epilogue {
  id: string;
  title: string;
  text: string;
}

export interface GameState {
  currentQuestionId: string | null;
  history: string[]; // IDs der gewählten Antworten
  isFinished: boolean;
  finalEpilogueId: string | null;
}
