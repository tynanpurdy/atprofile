import { useState, useRef, useEffect } from "preact/hooks";
import { TIME_THRESHOLD, UPDATE_INTERVAL } from "../constants";
import { WPMDataPoint } from "../types";

export const useWpmTracker = (
  sampleText: string,
  startTime: number | null,
  isFinished: boolean,
  userInput: string,
) => {
  const [wpmData, setWpmData] = useState<WPMDataPoint[]>([]);
  const userInputRef = useRef(userInput);
  const lastUpdateRef = useRef<number>(0);
  const prevErrorsRef = useRef<number>(0);

  const lastProcessedIndexRef = useRef(0);
  const correctCharsRef = useRef(0);
  const currentErrorsRef = useRef(0);

  useEffect(() => {
    userInputRef.current = userInput;

    if (userInputRef.current.length > 0 && wpmData.length < 1) {
      updateWPMData();
    }
  }, [userInput]);

  const calculateMetrics = (currentTime: number) => {
    if (startTime === null || startTime > currentTime) {
      return { timeElapsed: 0, correctChars: 0, currentErrors: 0, rawWpm: 0 };
    }

    const timeElapsed = (currentTime - startTime) / 1000; // Convert to seconds
    const currentInput = userInputRef.current;

    let newCorrect = 0;
    let newErrors = 0;

    for (let i = lastProcessedIndexRef.current; i < currentInput.length; i++) {
      if (currentInput[i] === sampleText[i]) {
        newCorrect++;
      } else {
        newErrors++;
      }
    }

    // Update cumulative counts
    correctCharsRef.current += newCorrect;
    currentErrorsRef.current += newErrors;
    lastProcessedIndexRef.current = currentInput.length;

    // Calculate raw WPM
    const rawWpm = (currentInput.length / 5) * (60 / timeElapsed);

    return {
      timeElapsed,
      correctChars: correctCharsRef.current,
      currentErrors: currentErrorsRef.current,
      rawWpm: rawWpm || 0, // Avoid NaN
    };
  };

  const updateWPMData = () => {
    const now = Date.now();
    if (!startTime) return;

    // Initialize lastUpdateRef to startTime on first call
    if (lastUpdateRef.current === 0) {
      lastUpdateRef.current = startTime;
    }

    const { timeElapsed, correctChars, currentErrors, rawWpm } =
      calculateMetrics(now);

    // Skip early updates to avoid spikes
    if (timeElapsed < TIME_THRESHOLD) {
      return;
    }

    // Calculate errors per second
    const timeSinceLastUpdate = (now - lastUpdateRef.current) / 1000;
    const timeDiff = Math.max(timeSinceLastUpdate, 0.001); // Minimum 1ms
    const errorDelta = currentErrors - prevErrorsRef.current;
    const errors = Math.max(errorDelta / timeDiff, 0);

    setWpmData((prev) => [
      ...prev,
      {
        time: Number(timeElapsed.toFixed(1)),
        wpm: Math.round(correctChars / 5 / (timeElapsed / 60)),
        rawWpm: Math.round(rawWpm),
        errors: Number(errors.toFixed(0)),
      },
    ]);

    lastUpdateRef.current = now;
    prevErrorsRef.current = currentErrors;
  };

  useEffect(() => {
    if (!startTime || isFinished) return;

    const intervalId = setInterval(updateWPMData, UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [startTime, isFinished, UPDATE_INTERVAL]);

  const resetWpmData = () => {
    setWpmData([]);
    lastUpdateRef.current = 0;
    prevErrorsRef.current = 0;
    lastProcessedIndexRef.current = 0;
    correctCharsRef.current = 0;
    currentErrorsRef.current = 0;
  };

  return { wpmData, resetWpmData };
};
