
export enum LearningLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export enum LearningMode {
  OVERVIEW = 'OVERVIEW',
  DEEP_DIVE = 'DEEP_DIVE',
  INTERACTIVE = 'INTERACTIVE',
  VAULT_TEACH = 'VAULT_TEACH'
}

export enum MentorPersonality {
  FRIENDLY = 'FRIENDLY',
  STRICT = 'STRICT',
  SOCRATIC = 'SOCRATIC'
}

export enum EvolutionTier {
  EXPLORER = 'Explorer',
  STRUCTURED_LEARNER = 'Structured Learner',
  SOCRATIC_THINKER = 'Socratic Thinker',
  SYSTEMS_MASTER = 'Systems Master'
}

export enum SynthesisDepth {
  QUICK = 'Quick',
  STANDARD = 'Standard',
  DEEP = 'Deep',
  MASTERCLASS = 'Masterclass'
}

export enum ExplanationDensity {
  CONCISE = 'Concise',
  BALANCED = 'Balanced',
  ELABORATE = 'Elaborate'
}

export enum ReasoningStyle {
  GUIDED = 'Guided',
  SOCRATIC = 'Socratic',
  CHALLENGE = 'Challenge'
}

export interface SynthesisConfig {
  mode: 'teach' | 'assess';
  depth: SynthesisDepth;
  density: ExplanationDensity;
  precisionMode: boolean;
  lenses: {
    analogies: boolean;
    mechanics: boolean;
    tradeoffs: boolean;
    pitfalls: boolean;
  };
  reasoningStyle: ReasoningStyle;
}

export enum PodcastVerbosity {
  OVERVIEW = 'OVERVIEW',
  BALANCED = 'BALANCED',
  DEEP_DIVE = 'DEEP_DIVE'
}

export interface PodcastEmotion {
  energy: 'low' | 'medium' | 'high';
  tone: 'curious' | 'excited' | 'serious' | 'reflective';
  intensity: number; // 0.3 - 0.9
}

export interface PodcastConfig {
  durationMin: number;
  verbosity: PodcastVerbosity;
  debateLevel: number; // 0.0 to 1.0
  pacing: 'relaxed' | 'normal' | 'fast';
}

export interface DialogueBlock {
  speaker: 'Alex' | 'Jordan';
  text: string;
}

export interface PodcastSegment {
  segment: string;
  duration: string;
  lead: string;
  goal: string;
  targetWordCount: number;
  emotion: PodcastEmotion;
  script?: string;
  blocks?: DialogueBlock[];
}

export interface PodcastMetadata {
  id: string;
  topic: string;
  config: PodcastConfig;
  segments: PodcastSegment[];
  fullScript: string;
  durationMinutes: number;
  totalWordCount: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface LessonSection {
  title: string;
  content: string;
}

export type KnowledgeItemType = 'highlight' | 'block' | 'note' | 'snapshot';

export interface Vault {
  id: string;
  userId: string;
  name: string;
  description?: string;
  topicHints?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TopicProgress {
  topic: string;
  mastery: number; // 0 to 1
  lastReviewed: number;
  interactions: number;
}

export interface TopicSuggestion {
  topic: string;
  reason: string;
  targetMastery: number;
}

export interface EvolutionProgress {
  currentTopic: string;
  inquiryCount: number;
  vaultSaveCount: number;
  sessionsCompleted: number;
}

export interface UserKnowledgeProfile {
  userId: string;
  items: TopicProgress[];
  suggestions?: TopicSuggestion[];
  evolutionTier: EvolutionTier;
  totalSaves: number;
  totalFollowUps: number;
  totalDeepDives: number;
  evolutionProgress: EvolutionProgress;
}

export interface KnowledgeItem {
  id: string;
  userId: string;
  vaultId: string;
  type: KnowledgeItemType;
  content: string;
  topic?: string;
  source: 'lesson' | 'chat' | 'article' | 'manual';
  context?: Record<string, any>;
  createdAt: number;
  updatedAt?: number;
  edited?: boolean;
  tags?: string[];
  links?: string[];
  folder?: string;
  optimistic?: boolean;
}

export interface SaveIntent {
  userId: string;
  vaultId: string;
  type: KnowledgeItemType;
  content: string;
  topic?: string;
  source: 'lesson' | 'chat' | 'article' | 'manual';
  context?: Record<string, any>;
  tags?: string[];
  folder?: string;
}

export interface LearningSession {
  id: string;
  topic: string;
  level: LearningLevel;
  mode: LearningMode;
  personality: MentorPersonality;
  summary: string;
  sections: LessonSection[];
  sources: GroundingSource[];
  timestamp: number;
  quizzes: QuizQuestion[];
  chatHistory: ChatMessage[];
  notes: string;
  highlights: string[]; 
  masteryScore: number;
  confusionPoints: string[];
  suggestions?: TopicSuggestion[];
  synthesisConfig?: SynthesisConfig;
}

export interface UserStats {
  totalTopics: number;
  totalQuizzes: number;
  streak: number;
  lastActive: number;
}
