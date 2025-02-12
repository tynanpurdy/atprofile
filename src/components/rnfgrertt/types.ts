// types.ts
export type TypingError = {
  position: number;
  timestamp: number;
  expected: string;
  actual: string;
};

export type WPMDataPoint = {
  time: number;
  wpm: number;
  rawWpm: number;
  errorsPerSecond?: number;
};

export type TypingStats = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  charRatio: string;
  consistency: number;
  time: number;
  errorCount: number;
};

export type TextMeta = {
  text: string;
  source?: string;
};

export type TimerOption = 15 | 30 | 60 | 120;

export type CursorStyle = "block" | "line" | "underline";
