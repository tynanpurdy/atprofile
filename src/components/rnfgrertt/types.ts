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
  errors?: number;
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

export type TypingTestMode = "text" | "timer" | "quote";

export type TimerOption = 15 | 30 | 60 | 120;
export type QuoteOption = "short" | "med" | "long" | "xl";
export type TextOption = TimerOption;

export type CursorStyle = "block" | "line" | "underline";
