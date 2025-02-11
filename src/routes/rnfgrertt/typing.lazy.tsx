import { createLazyFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "preact/hooks";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Type definitions
type TypingError = {
  position: number;
  timestamp: number;
  expected: string;
  actual: string;
};

type WPMDataPoint = {
  time: number;
  wpm: number;
  errorsPerSecond: number;
};

type TypingStats = {
  accuracy: string;
  wpm: string;
  time: string;
  errorCount: number;
};

// Constants
const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";
const UPDATE_INTERVAL = 500;
const CHART_MARGIN = { top: 5, right: 30, left: 20, bottom: 5 };

// Custom hooks
const useWpmTracker = (
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
    if (userInputRef.current.length >= 5 && wpmData.length < 1) {
      updateWPMData();
    }
  }, [userInput]);

  const calculateMetrics = (currentTime: number) => {
    if (startTime === null)
      return { timeElapsed: 0, correctChars: 0, currentErrors: 0 };
    const timeElapsed = (currentTime - startTime) / 1000;
    const currentInput = userInputRef.current;

    // Calculate correct characters and current errors
    let correctChars = 0;
    let currentErrors = 0;

    for (let i = 0; i < currentInput.length; i++) {
      if (currentInput[i] === SAMPLE_TEXT[i]) {
        correctChars++;
      } else {
        currentErrors++;
      }
    }

    return { timeElapsed, correctChars, currentErrors };
  };

  const updateWPMData = () => {
    const now = Date.now();
    const { timeElapsed, correctChars, currentErrors } = calculateMetrics(now);

    // Calculate errors per second
    const timeDiff = (now - (lastUpdateRef.current || now)) / 1000;
    const errorDelta = currentErrors - prevErrorsRef.current;
    const errorsPerSecond = timeDiff > 0 ? errorDelta / timeDiff : 0;

    setWpmData((prev) => [
      ...prev,
      {
        time: Number(timeElapsed.toFixed(1)),
        wpm: Math.round(correctChars / 5 / (timeElapsed / 60)),
        errorsPerSecond: Number(errorsPerSecond.toFixed(1)),
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

const useErrorTracker = (errors: TypingError[]) => {
  const [errorDistribution, setErrorDistribution] = useState<
    { position: number; count: number }[]
  >([]);

  useEffect(() => {
    const distribution = new Array(SAMPLE_TEXT.length).fill(0);
    errors.forEach(({ position }) => distribution[position]++);
    setErrorDistribution(
      distribution
        .map((count, position) => ({ position, count }))
        .filter((d) => d.count > 0),
    );
  }, [errors]);

  return errorDistribution;
};

const useTypingTest = () => {
  const [state, setState] = useState({
    userInput: "",
    isFinished: false,
    startTime: null as number | null,
    endTime: null as number | null,
    errors: [] as TypingError[],
  });

  const handleInput = (input: string) => {
    if (state.isFinished) return;

    const newInput = input.slice(0, SAMPLE_TEXT.length);
    const newErrors = [...state.errors];

    // Track new errors
    if (newInput.length > state.userInput.length) {
      const newCharIndex = newInput.length - 1;
      if (newInput[newCharIndex] !== SAMPLE_TEXT[newCharIndex]) {
        newErrors.push({
          position: newCharIndex,
          timestamp: Date.now(),
          expected: SAMPLE_TEXT[newCharIndex],
          actual: newInput[newCharIndex],
        });
      }
    }

    setState((prev) => ({
      ...prev,
      userInput: newInput,
      errors: newErrors,
      startTime: prev.startTime || (newInput.length > 0 ? Date.now() : null),
      isFinished: newInput.length === SAMPLE_TEXT.length,
      endTime:
        newInput.length === SAMPLE_TEXT.length ? Date.now() : prev.endTime,
    }));
  };

  const resetTest = () => {
    setState({
      userInput: "",
      isFinished: false,
      startTime: null,
      endTime: null,
      errors: [],
    });
  };

  return { ...state, handleInput, resetTest };
};

// UI Components
const ResultsView = ({
  stats,
  wpmData,
  resetTest,
}: {
  stats: TypingStats;
  wpmData: WPMDataPoint[];
  resetTest: () => void;
}) => (
  <div className="m-auto px-4 py-16 flex-1 max-w-screen-sm text-center bg-card space-y-4 p-6 rounded-lg">
    <h2 className="text-2xl font-bold mb-4">Test Results</h2>
    <StatsGrid stats={stats} />
    <PerformanceChart wpmData={wpmData} />
    <ResetButton onClick={resetTest} />
  </div>
);

const StatsGrid = ({ stats }: { stats: TypingStats }) => (
  <div className="grid grid-cols-4 gap-4">
    {Object.entries(stats).map(([key, value]) => (
      <StatBox key={key} label={key} value={value} />
    ))}
  </div>
);

const StatBox = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="bg-muted p-4 rounded">
    <div className="text-gray-500 text-sm">{label}</div>
    <div className="text-3xl font-bold">{value}</div>
    <div className="text-gray-500 text-sm">{getUnit(label)}</div>
  </div>
);

const PerformanceChart = ({ wpmData }: { wpmData: WPMDataPoint[] }) => (
  <div className="mt-8 flex flex-col justify-center items-center">
    <h3 className="text-xl font-bold mb-4">Performance Over Time</h3>
    <LineChart width={650} height={300} data={wpmData} margin={CHART_MARGIN}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="time"
        type="number"
        label={{ value: "Time (seconds)", position: "bottom" }}
        domain={[0, "auto"]}
      />
      <YAxis
        yAxisId="left"
        label={{ value: "WPM", angle: -90, position: "insideLeft" }}
      />
      <YAxis
        yAxisId="right"
        orientation="right"
        label={{ value: "Errors/sec", angle: 90, position: "insideRight" }}
        domain={[0, Math.max(...wpmData.map((d) => d.errorsPerSecond), 1)]}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Line
        yAxisId="left"
        type="monotone"
        dataKey="wpm"
        stroke="#8884d8"
        name="WPM"
        strokeWidth={2}
        dot={false}
      />
      <Line
        yAxisId="right"
        type="monotone"
        dataKey="errorsPerSecond"
        stroke="#ff4757"
        name="Errors/sec"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </div>
);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border rounded shadow">
        <p className="text-sm">Time: {data.time}s</p>
        <p className="text-sm text-blue-500">WPM: {data.wpm}</p>
        <p className="text-sm text-red-500">
          Errors/sec: {data.errorsPerSecond}
        </p>
      </div>
    );
  }
  return null;
};

const TypingArea = ({
  userInput,
  handleInput,
}: {
  userInput: string;
  handleInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => (
  <div className="m-auto flex-1 relative p-4 bg-muted rounded-lg h-min max-w-xl">
    <TextDisplay userInput={userInput} />
    <textarea
      className="absolute top-0 left-0 w-full h-full p-4 resize-none bg-transparent text-transparent caret-transparent outline-none"
      value={userInput}
      onChange={handleInput}
      autoFocus
    />
  </div>
);

const TextDisplay = ({ userInput }: { userInput: string }) => (
  <div className="whitespace-pre-wrap break-words">
    {SAMPLE_TEXT.split("").map((char, i) => {
      const status =
        i < userInput.length
          ? userInput[i] === char
            ? "text-green-500"
            : "text-red-500 underline"
          : "";
      return (
        <span
          key={i}
          className={`${status} ${i === userInput.length ? "bg-muted animate-blink" : ""}`}
        >
          {char}
        </span>
      );
    })}
  </div>
);

// Helper components

const CustomErrorDot = (props: any) =>
  props.payload.errors >= 1 ? (
    <circle cx={props.cx} cy={props.cy} r={4} fill="#ff4757" stroke="none" />
  ) : null;

const ResetButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
  >
    Try Again
  </button>
);

// Helper functions
const getUnit = (label: string) => {
  switch (label) {
    case "accuracy":
      return "%";
    case "wpm":
      return "WPM";
    case "time":
      return "seconds";
    case "errorCount":
      return "total";
    default:
      return "";
  }
};

const calculateStats = (
  userInput: string,
  errors: TypingError[],
  startTime: number,
  endTime: number,
): TypingStats => {
  const timeElapsed = (endTime - startTime) / 1000;
  const correctChars = userInput
    .split("")
    .filter((char, i) => char === SAMPLE_TEXT[i]).length;

  return {
    accuracy: ((correctChars / SAMPLE_TEXT.length) * 100).toFixed(1),
    wpm: (correctChars / 5 / (timeElapsed / 60)).toFixed(1),
    time: timeElapsed.toFixed(1),
    errorCount: errors.length,
  };
};

// Main component
export const Route = createLazyFileRoute("/rnfgrertt/typing")({
  component: () => {
    const {
      userInput,
      isFinished,
      startTime,
      endTime,
      errors,
      handleInput,
      resetTest,
    } = useTypingTest();
    const { wpmData, resetWpmData } = useWpmTracker(
      startTime,
      isFinished,
      userInput,
    );
    //const errorDistribution = useErrorTracker(errors);

    const resetAll = () => {
      resetTest();
      resetWpmData();
    };

    const stats =
      startTime && endTime
        ? calculateStats(userInput, errors, startTime, endTime)
        : ({} as TypingStats);

    return (
      <main className="h-screen relative max-h-[calc(100vh-5rem)] flex">
        {isFinished ? (
          <ResultsView stats={stats} wpmData={wpmData} resetTest={resetAll} />
        ) : (
          <TypingArea
            userInput={userInput}
            handleInput={(e) =>
              handleInput((e.target as HTMLTextAreaElement).value)
            }
          />
        )}
      </main>
    );
  },
});
