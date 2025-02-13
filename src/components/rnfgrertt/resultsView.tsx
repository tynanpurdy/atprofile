import { Camera, RefreshCw } from "lucide-react";
import { useState, useRef } from "preact/hooks";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  LineChart,
} from "recharts";
import { CHART_MARGIN } from "./constants";
import { TextMeta, TypingStats, WPMDataPoint } from "./types";
import * as htmlToImage from "html-to-image";
import { TestConfig } from "@/routes/rnfgrertt/typing.lazy";

export const ResultsView = ({
  stats,
  wpmData,
  resetTest,
  textData,
  testConfig,
}: {
  stats: TypingStats;
  wpmData: WPMDataPoint[];
  resetTest: () => void;
  textData: string | TextMeta;
  testConfig: TestConfig;
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const takeScreenshot = async () => {
    if (!resultsRef.current) return;
    setIsSaving(true);

    try {
      const blob = await htmlToImage.toBlob(resultsRef.current, {
        pixelRatio: 4,
        fontEmbedCSS: await htmlToImage.getFontEmbedCSS(resultsRef.current),
        cacheBust: true,
      });
      if (blob) {
        navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
      }
    } catch (err) {
      console.error("Failed to take screenshot:", err);
    }
    setIsSaving(false);
  };

  return (
    <div className="m-auto bg-card px-4 py-16 flex-1 max-w-screen-lg text-center rounded-lg">
      <div>
        <h2 className="text-2xl text-muted-foreground -mb-4 text-start ml-8">
          Results
        </h2>
        <div ref={resultsRef} className="bg-card text-base px-4 py-2">
          <div className="flex flex-col lg:flex-row">
            <div className=" flex flex-row lg:flex-col justify-start lg:justify-around">
              <StatBox label="wpm" value={stats.wpm} />
              <StatBox label="accuracy" value={stats.accuracy} following="%" />
            </div>
            <div className="-my-4">
              <PerformanceChart wpmData={wpmData} />
            </div>
          </div>
          <div className="mt-2 flex justify-between pb-4">
            <div className="rounded text-left px-4">
              <div className="text-muted-foreground text-sm">mode</div>

              <div className="">
                {testConfig.mode}
                <br />
                {testConfig.mode === "time"
                  ? testConfig.selectedTimer
                  : testConfig.mode === "random"
                    ? testConfig.randomLen
                    : testConfig.quoteLen}
                {testConfig.mode === "time"
                  ? "s"
                  : testConfig.mode === "random"
                    ? "chars"
                    : ""}
              </div>
            </div>
            <StatList
              label="consistency"
              value={stats.consistency}
              following="%"
            />
            <StatList label="raw" value={stats.rawWpm} />
            <StatList label="ratio" value={stats.charRatio} />
            <StatList
              label="time taken"
              value={stats.time}
              following=" seconds"
            />
          </div>
          {isSaving ? (
            <div className="text-end">
              type@tools - {new Date().toLocaleString()}
            </div>
          ) : (
            <>
              <div className="text-end text-muted-foreground">
                {typeof textData !== "string" &&
                  "Excerpt from: " + textData.source}
              </div>
              <div className="mt-8 flex gap-4 justify-center">
                <button
                  onClick={resetTest}
                  className="text-muted-foreground hover:text-foreground transition-all hover:rotate-180"
                >
                  <RefreshCw />
                </button>
                <button
                  onClick={takeScreenshot}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Camera />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatBox = ({
  label,
  value,
  following,
}: {
  label: string;
  value: string | number;
  following?: string;
}) => (
  <div className="rounded text-left ml-4 w-36">
    <div className="">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-7xl">
        {typeof value === "number" ? value.toFixed(0) : value}
        {following}
      </div>
    </div>
  </div>
);

const StatList = ({
  label,
  value,
  following,
}: {
  label: string;
  value: string | number;
  following?: string;
}) => (
  <div className="rounded text-left px-4">
    <div className="text-muted-foreground text-sm">{label}</div>
    <div className="text-2xl">
      {typeof value === "number" ? value.toFixed(0) : value}
      {following}
    </div>
  </div>
);

const CustomDot = (props: any) => {
  const { cx, cy, value } = props;

  // Only render dot if the error value is not zero
  if (value === 0) return null;

  return (
    <svg
      x={cx - 6}
      y={cy - 6}
      width={12}
      height={12}
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d="M2 2L10 10M10 2L2 10"
        stroke="#ff4757"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

const PerformanceChart = ({ wpmData }: { wpmData: WPMDataPoint[] }) => (
  <div className="mt-8 flex flex-col justify-center items-center">
    <LineChart width={850} height={250} data={wpmData} margin={CHART_MARGIN}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="time"
        type="number"
        scale="linear"
        allowDecimals={false}
        label={{ value: "Time (seconds)", position: "bottom" }}
        domain={[1, "max"]}
        tickCount={Math.max(Math.ceil(wpmData.length / 8), 10)}
      />
      <YAxis
        yAxisId="left"
        orientation="left"
        label={{
          value: "words/min",
          angle: -90,
          position: "insideBottomLeft",
          offset: 25,
        }}
      />
      <YAxis
        yAxisId="right"
        orientation="right"
        allowDecimals={false}
        label={{
          value: "Errors",
          angle: 90,
          position: "insideTopLeft",
          offset: 30,
        }}
        domain={[0, Math.max(...wpmData.map((d) => d.errorsPerSecond || 0), 1)]}
      />
      <Tooltip content={<CustomTooltip />} />
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
        yAxisId="left"
        type="monotone"
        dataKey="rawWpm"
        stroke="#817492"
        name="Raw WPM"
        strokeWidth={2}
        dot={false}
      />

      <Line
        yAxisId="right"
        type="monotone"
        dataKey="errorsPerSecond"
        stroke="#ff4757"
        name="Errors"
        strokeWidth={0}
        dot={<CustomDot />}
      />
    </LineChart>
  </div>
);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-muted p-2 border rounded shadow">
        <p className="text-sm">time: {data.time}s</p>
        <p className="text-sm text-blue-500">wpm: {data.wpm}</p>
        <p className="text-sm text-blue-500">raw: {data.rawWpm}</p>
        <p className="text-sm text-red-500">errors: {data.errorsPerSecond}</p>
      </div>
    );
  }
  return null;
};
