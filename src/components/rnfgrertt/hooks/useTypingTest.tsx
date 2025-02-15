import { useEffect, useState } from "preact/hooks";
import { TypingError } from "../types";

export function useTypingTest(
  sampleText: string,
  timerSeconds: number | null,
  onNeedMoreText: () => void,
) {
  const [state, setState] = useState({
    userInput: "",
    isFinished: false,
    startTime: null as number | null,
    endTime: null as number | null,
    errors: [] as TypingError[],
    timeRemaining: timerSeconds, // Add this
  });

  // Add timer effect
  useEffect(() => {
    if (!state.startTime || !timerSeconds) return;

    const intervalId = setInterval(() => {
      if (!state.startTime) return;
      const elapsed = (Date.now() - state.startTime) / 1000;
      const remaining = timerSeconds - elapsed;

      if (remaining <= 0) {
        setState((prev) => ({
          ...prev,
          isFinished: true,
          endTime: Date.now(),
        }));
        clearInterval(intervalId);
      } else {
        setState((prev) => ({ ...prev, timeRemaining: remaining }));
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [state.startTime, timerSeconds]);

  const handleInput = (input: string) => {
    if (state.isFinished) return;

    if (input.length > sampleText.length - 20) {
      onNeedMoreText();
    }

    const newInput = input.slice(0, sampleText.length);
    const newErrors = [...state.errors];

    // Track new errors
    if (newInput.length > state.userInput.length) {
      const newCharIndex = newInput.length - 1;
      if (newInput[newCharIndex] !== sampleText[newCharIndex]) {
        newErrors.push({
          position: newCharIndex,
          timestamp: Date.now(),
          expected: sampleText[newCharIndex],
          actual: newInput[newCharIndex],
        });
      }
    }

    setState((prev) => ({
      ...prev,
      userInput: newInput,
      errors: newErrors,
      startTime: prev.startTime || (newInput.length > 0 ? Date.now() : null),
      isFinished: newInput.length === sampleText.length,
      endTime:
        newInput.length === sampleText.length ? Date.now() : prev.endTime,
    }));
  };

  const resetTest = () => {
    setState({
      userInput: "",
      isFinished: false,
      startTime: null,
      endTime: null,
      errors: [],
      timeRemaining: null,
    });
  };

  return { ...state, handleInput, resetTest };
}
