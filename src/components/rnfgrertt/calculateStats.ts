// utils/calculateStats.ts
import { TypingError, TypingStats, WPMDataPoint } from "./types";

export const calculateStats = (
  userInput: string,
  sampleText: string,
  errors: TypingError[],
  startTime: number,
  endTime: number,
  wpmData: WPMDataPoint[],
): TypingStats => {
  const timeElapsed = (endTime - startTime) / 1000;

  // Count correct and total characters
  let correctChars = 0;
  let totalKeystrokes = userInput.length;

  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i] === sampleText[i]) {
      correctChars++;
    }
  }

  // Calculate WPM (only correct words)
  const wpm = (correctChars / 5) * (60 / timeElapsed);

  // Calculate Raw WPM (including incorrect words)
  const rawWpm = (userInput.length / 5) * (60 / timeElapsed);

  // Calculate accuracy
  const accuracy = (correctChars / totalKeystrokes) * 100;

  // Calculate character ratio
  const incorrectChars = totalKeystrokes - correctChars;
  const fixedChars = errors.length - incorrectChars;
  const charRatio = `${correctChars}:${incorrectChars}:${fixedChars}`;

  // Calculate consistency using coefficient of variation of raw WPM
  const rawWpmValues = wpmData.map((point) => point.wpm);
  const mean = rawWpmValues.reduce((a, b) => a + b, 0) / rawWpmValues.length;
  const variance =
    rawWpmValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
    rawWpmValues.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100;
  const consistency = Math.max(0, Math.min(100, 100 - cv));

  return {
    wpm: wpm,
    rawWpm: rawWpm,
    accuracy: accuracy,
    charRatio: charRatio,
    consistency: consistency,
    time: timeElapsed,
    errorCount: errors.length,
  };
};
