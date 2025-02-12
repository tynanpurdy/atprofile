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

  let errorsMade = errors.length;
  let correctKeystrokes = userInput.length - errorsMade;

  // Calculate WPM (only correct words)
  const wpm = (correctKeystrokes / 5) * (60 / timeElapsed);

  // Calculate Raw WPM (including incorrect words)
  const rawWpm = (userInput.length / 5) * (60 / timeElapsed);

  // Calculate accuracy
  const accuracy = (correctKeystrokes / totalKeystrokes) * 100;

  // Calculate character ratio
  const incorrectChars = totalKeystrokes - correctChars;
  const fixedChars = errors.length - incorrectChars;
  const charRatio = `${correctChars}:${incorrectChars}:${fixedChars}`;

  // Calculate consistency using coefficient of variation of raw WPM
  const rawWpmValues = wpmData.map((point) => point.wpm);
  const mean = rawWpmValues.reduce((a, b) => a + b, 0) / rawWpmValues.length;

  // Calculate weighted standard deviation
  const weightedVariance =
    rawWpmValues.reduce((acc, wpm) => {
      const diff = wpm - mean;
      // Apply smaller weight to variations at higher speeds
      const weight = Math.max(0.5, 100 / mean);
      return acc + diff * diff * weight;
    }, 0) / rawWpmValues.length;

  const weightedStdDev = Math.sqrt(weightedVariance);

  // Adjust consistency calculation for higher WPM
  const baseConsistency = Math.max(0, 100 - (weightedStdDev / mean) * 100);
  const consistency = Math.min(
    100,
    baseConsistency * (1 + Math.log10(mean / 100)),
  );

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
