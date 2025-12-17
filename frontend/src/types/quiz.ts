// Quiz types
export interface Quiz {
  id: string;
  userId: string;
  title: string;
  language: string;
  difficulty: string;
  version: string;
  totalQuestions: number;
  recommendedTimeMin: number;
  correctPoints: number;
  wrongPoints: number;
  maxScore: number;
  sectionsJson: QuizSection[];
  questionsJson: Question[];
  createdAt: string;
  updatedAt: string;
  stats?: QuizStats;
  hasInProgressAttempt?: boolean;
  inProgressAttempt?: QuizAttempt | null;
}

export interface QuizSection {
  id: string;
  name: string;
  question_ids: string[];
}

export interface QuizStats {
  totalAttempts: number;
  completedAttempts?: number;
  averageScore: number | null;
  bestScore: number | null;
  averagePercentage: number | null;
  averageTime: number | null;
  lastAttempt?: string | null;
}

// Question types
export type Question =
  | SimpleQuestion
  | MatrixQuestion
  | QuantifiedLogicQuestion
  | PropositionalLogicQuestion
  | LogicPuzzleQuestion
  | SymbolEncodingQuestion;

export interface BaseQuestion {
  id: string;
  type: string;
  choices: Record<string, string>;
  answer: string;
}

export interface SimpleQuestion extends BaseQuestion {
  type: 'sequence' | 'mapping' | 'custom_operator' | 'recurrence' | 'arithmetic_word' | 'analogy' | 'classification';
  prompt: string;
  definition?: string; // For custom_operator
}

export interface MatrixQuestion extends BaseQuestion {
  type: 'matrix';
  prompt: (number | null)[][];
}

export interface QuantifiedLogicQuestion extends BaseQuestion {
  type: 'quantified_logic';
  prompt: {
    premises: Array<{
      quantifier: 'all' | 'some' | 'none';
      subject: string;
      predicate: string;
    }>;
    conclusion: {
      quantifier: 'all' | 'some' | 'none';
      subject: string;
      predicate: string;
    };
  };
}

export interface PropositionalLogicQuestion extends BaseQuestion {
  type: 'propositional_logic';
  prompt: {
    premises: string[];
    question: string;
  };
}

export interface LogicPuzzleQuestion extends BaseQuestion {
  type: 'logic_puzzle';
  prompt: {
    setup: string;
    statements: Record<string, string>;
    constraint: string;
  };
}

export interface SymbolEncodingQuestion extends BaseQuestion {
  type: 'symbol_encoding';
  prompt: {
    example: string;
    rule_hint: string;
    question: string;
  };
}

// Quiz attempt types
export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  mode: 'practice' | 'test';
  status: 'in_progress' | 'completed' | 'abandoned';
  isRandomized: boolean;
  randomizedOrderJson?: {
    order: string[];
    sections: QuizSection[];
  };
  currentQuestionIndex: number;
  startedAt: string;
  completedAt?: string;
  timeSpentSeconds?: number;
  lastSavedAt?: string;
  score?: number;
  maxScore: number;
  percentage?: number;
  answersJson: Record<string, string>;
  resultsJson?: Record<string, QuestionResult>;
  quiz?: Quiz;
}

export interface QuestionResult {
  correct: boolean;
  userAnswer: string | null;
  correctAnswer: string;
}

// API request/response types
export interface CreateQuizRequest {
  meta: {
    title: string;
    language: string;
    difficulty: string;
    version: string;
    total_questions: number;
    recommended_time_minutes: number;
    scoring: {
      correct_points: number;
      wrong_points: number;
      max_score: number;
    };
  };
  sections: QuizSection[];
  questions: Question[];
}

export interface StartQuizRequest {
  mode: 'practice' | 'test';
  randomize?: boolean;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer: string;
}

export interface SaveProgressRequest {
  currentQuestionIndex: number;
}

export interface QuizListResponse {
  data: Quiz[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttemptListResponse {
  data: QuizAttempt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
