import { useState, useRef, useEffect } from "preact/hooks";
import { UPDATE_INTERVAL } from "../constants";
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

  useEffect(() => {
    userInputRef.current = userInput;
    if (userInputRef.current.length >= 10 && wpmData.length < 1) {
      updateWPMData();
    }
  }, [userInput]);

  const calculateMetrics = (currentTime: number) => {
    if (startTime === null)
      return { timeElapsed: 0, correctChars: 0, currentErrors: 0, rawWpm: 0 };

    const timeElapsed = (currentTime - startTime) / 1000;
    const currentInput = userInputRef.current;

    // Calculate correct characters and current errors
    let correctChars = 0;
    let currentErrors = 0;

    for (let i = 0; i < currentInput.length; i++) {
      if (currentInput[i] === sampleText[i]) {
        correctChars++;
      } else {
        currentErrors++;
      }
    }

    // Calculate raw WPM
    const rawWpm = (currentInput.length / 5) * (60 / timeElapsed);

    return { timeElapsed, correctChars, currentErrors, rawWpm };
  };

  const updateWPMData = () => {
    const now = Date.now();
    const { timeElapsed, correctChars, currentErrors, rawWpm } =
      calculateMetrics(now);

    // Calculate errors per second
    const timeDiff = (now - (lastUpdateRef.current || now)) / UPDATE_INTERVAL;
    const errorDelta = currentErrors - prevErrorsRef.current;
    const errorsPerSecond = timeDiff > 0 ? errorDelta / timeDiff : 0;

    setWpmData((prev) => [
      ...prev,
      {
        time: Number(timeElapsed.toFixed(1)),
        wpm: Math.round(correctChars / 5 / (timeElapsed / 60)),
        rawWpm: Math.round(rawWpm),
        errorsPerSecond: Number(errorsPerSecond.toFixed(0)),
      },
    ]);

    lastUpdateRef.current = now;
    prevErrorsRef.current = currentErrors;
  };

  useEffect(() => {
    if (!startTime || isFinished) return;

    // Subsequent updates at interval
    const intervalId = setInterval(updateWPMData, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [startTime, isFinished]);

  const resetWpmData = () => setWpmData([]);
  return { wpmData, resetWpmData };
};
