import { useState, useEffect } from "preact/hooks";
import { UPDATE_INTERVAL } from "../constants";
import { TypingError } from "../types";

export const calculateTypingMetrics = (
  userInput: string,
  sampleText: string,
  startTime: number | null,
  endTime: number | null,
  errors: TypingError[],
  timePoint?: number,
) => {
  if (!startTime || userInput.length === 0) {
    return {
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      errorsPerSecond: 0,
    };
  }

  const currentTime = timePoint
    ? startTime + timePoint * UPDATE_INTERVAL
    : endTime || Date.now();

  const timeElapsedMinutes = (currentTime - startTime) / 1000 / 60;

  // Calculate correct characters
  let correctChars = 0;
  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i] === sampleText[i]) {
      correctChars++;
    }
  }

  // Calculate WPM metrics
  const rawWpm = userInput.length / 5 / timeElapsedMinutes;
  const wpm = correctChars / 5 / timeElapsedMinutes;

  // Calculate accuracy
  const accuracy = (correctChars / userInput.length) * 100;

  // Calculate interpolated errors per second
  const errorsInWindow =
    timePoint !== undefined
      ? errors.filter(
          (error) =>
            (error.timestamp - startTime) / UPDATE_INTERVAL <= timePoint &&
            (error.timestamp - startTime) / UPDATE_INTERVAL > timePoint - 1, // Look back 1 second
        ).length
      : errors.filter(
          (error) => currentTime - error.timestamp <= 1000, // Last second for final calculation
        ).length;

  return {
    wpm: Math.round(wpm),
    rawWpm: Math.round(rawWpm),
    accuracy: Math.round(accuracy * 100) / 100,
    errorsPerSecond: errorsInWindow, // Direct count for 1-second window
  };
};

export const useTypingMetricsTracker = (
  userInput: string,
  sampleText: string,
  startTime: number | null,
  endTime: number | null,
  errors: TypingError[],
  isFinished: boolean,
) => {
  const [metricsHistory, setMetricsHistory] = useState<
    Array<{
      time: number;
      metrics: ReturnType<typeof calculateTypingMetrics>;
    }>
  >([]);

  useEffect(() => {
    if (!startTime || isFinished) return;

    const intervalId = setInterval(() => {
      const timePoint = (Date.now() - startTime) / UPDATE_INTERVAL;

      const metrics = calculateTypingMetrics(
        userInput,
        sampleText,
        startTime,
        endTime,
        errors,
        timePoint,
      );

      setMetricsHistory((prev) => [
        ...prev,
        {
          time: Number(timePoint.toFixed(1)),
          metrics,
        },
      ]);
    }, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [startTime, isFinished, userInput, errors]);

  return metricsHistory.map((point) => ({
    time: point.time,
    wpm: point.metrics.wpm,
    rawWpm: point.metrics.rawWpm,
    errorsPerSecond: point.metrics.errorsPerSecond,
  }));
};
