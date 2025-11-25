// =================================================================
// User Types
// =================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// =================================================================
// API Response Types
// =================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

// =================================================================
// Common Enums
// =================================================================

export type MoodRating = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';

export type IeltsSkillType = 'reading' | 'writing' | 'listening' | 'speaking';
export type BookStatus = 'to_read' | 'reading' | 'completed' | 'abandoned';
export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment';
export type ActivityType = 'networking' | 'learning' | 'project' | 'application' | 'interview' | 'other';
export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn' | 'accepted';
export type PrepItemType = 'document' | 'exam' | 'research' | 'contact' | 'deadline' | 'other';
export type PrepItemStatus = 'not_started' | 'in_progress' | 'completed';

// =================================================================
// Daily Log Types
// =================================================================

export interface DailyLog {
  id: string;
  userId: string;
  date: string;
  overallMood: MoodRating;
  energyLevel: EnergyLevel;
  sleepHours: number;
  sleepQuality: MoodRating;
  exerciseMinutes: number;
  waterIntake: number;
  screenTimeMinutes: number;
  productiveHours: number;
  stressLevel: MoodRating;
  gratitude: string[];
  highlights: string[];
  challenges: string[];
  tomorrowGoals: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// =================================================================
// IELTS Types
// =================================================================

export interface IeltsSession {
  id: string;
  userId: string;
  date: string;
  skillType: IeltsSkillType;
  durationMinutes: number;
  practiceType: string;
  score: number | null;
  maxScore: number | null;
  materials: string | null;
  notes: string | null;
  focusAreas: string[];
  createdAt: string;
}

export interface IeltsVocab {
  id: string;
  userId: string;
  word: string;
  definition: string;
  example: string | null;
  context: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  mastered: boolean;
  reviewCount: number;
  lastReviewedAt: string | null;
  createdAt: string;
}

// =================================================================
// Journal Types
// =================================================================

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  authors: string[];
  source: string | null;
  url: string | null;
  publicationDate: string | null;
  dateRead: string;
  readingTimeMinutes: number;
  category: string;
  tags: string[];
  summary: string | null;
  keyFindings: string[];
  methodology: string | null;
  criticalAnalysis: string | null;
  applicationIdeas: string[];
  rating: MoodRating | null;
  notes: string | null;
  createdAt: string;
}

// =================================================================
// Book Types
// =================================================================

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string | null;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  genre: string | null;
  startDate: string | null;
  finishDate: string | null;
  rating: MoodRating | null;
  review: string | null;
  notes: string | null;
  createdAt: string;
}

export interface BookReadingSession {
  id: string;
  bookId: string;
  pagesRead: number;
  durationMinutes: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

// =================================================================
// Skill Types
// =================================================================

export interface SkillSession {
  id: string;
  userId: string;
  skillName: string;
  category: string;
  date: string;
  durationMinutes: number;
  activityType: string;
  resources: string[];
  notes: string | null;
  progress: string | null;
  difficultyLevel: MoodRating | null;
  createdAt: string;
}

// =================================================================
// Workout Types
// =================================================================

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string;
  workoutType: WorkoutType;
  name: string;
  durationMinutes: number;
  caloriesBurned: number | null;
  notes: string | null;
  rating: MoodRating | null;
  createdAt: string;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseName: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  durationSeconds: number | null;
  distance: number | null;
  notes: string | null;
}

// =================================================================
// Wellness Types
// =================================================================

export interface WellnessEntry {
  id: string;
  userId: string;
  date: string;
  type: string;
  durationMinutes: number;
  notes: string | null;
  moodBefore: MoodRating | null;
  moodAfter: MoodRating | null;
  createdAt: string;
}

// =================================================================
// Financial Types
// =================================================================

export interface FinancialTransaction {
  id: string;
  userId: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  currency: string;
  description: string | null;
  tags: string[];
  recurring: boolean;
  createdAt: string;
}

// =================================================================
// Reflection Types
// =================================================================

export interface ReflectionEntry {
  id: string;
  userId: string;
  date: string;
  type: string;
  prompt: string | null;
  content: string;
  mood: MoodRating | null;
  insights: string[];
  actionItems: string[];
  tags: string[];
  createdAt: string;
}

// =================================================================
// Career Types
// =================================================================

export interface CareerActivity {
  id: string;
  userId: string;
  date: string;
  activityType: ActivityType;
  title: string;
  description: string | null;
  company: string | null;
  contactPerson: string | null;
  outcome: string | null;
  followUpDate: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  location: string | null;
  jobUrl: string | null;
  salary: string | null;
  status: ApplicationStatus;
  appliedDate: string;
  lastUpdated: string;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
  nextSteps: string | null;
  createdAt: string;
}

// =================================================================
// Masters Prep Types
// =================================================================

export interface MastersPrepItem {
  id: string;
  userId: string;
  type: PrepItemType;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: PrepItemStatus;
  priority: Priority;
  university: string | null;
  program: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface MastersPrepSession {
  id: string;
  userId: string;
  date: string;
  durationMinutes: number;
  activity: string;
  university: string | null;
  program: string | null;
  notes: string | null;
  progress: string | null;
  createdAt: string;
}

// =================================================================
// Project Types
// =================================================================

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: Status;
  priority: Priority;
  startDate: string | null;
  targetDate: string | null;
  completedAt: string | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// =================================================================
// Goal Types
// =================================================================

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  targetDate: string | null;
  status: Status;
  priority: Priority;
  progress: number;
  milestones: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// =================================================================
// Dashboard Types
// =================================================================

export interface TodaySummary {
  dailyLog: DailyLog | null;
  activitiesCount: {
    ielts: number;
    journals: number;
    skills: number;
    workouts: number;
    wellness: number;
    reflections: number;
  };
  goals: {
    active: number;
    completed: number;
  };
}

export interface WeeklyOverview {
  dailyLogs: DailyLog[];
  totalMinutes: {
    ielts: number;
    skills: number;
    workouts: number;
    wellness: number;
  };
  averageMood: number;
  averageEnergy: number;
  averageSleep: number;
}

export interface MonthlyStats {
  totalDays: number;
  loggedDays: number;
  averageMood: number;
  averageProductiveHours: number;
  totalExerciseMinutes: number;
  booksCompleted: number;
  journalsRead: number;
  skillSessionsCount: number;
}
