import { Camera, Check, Clipboard, Loader2, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect, useContext } from "preact/hooks";
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
import { ToolsAtpTypingTest } from "@atcute/client/lexicons";

import { QtContext } from "@/providers/qtprovider";
import { generateTid } from "@/lib/tid";

function AutoSubmitStats({
  stats,
  wpmData,
  textData,
  testConfig,
  userInput,
}: {
  stats: TypingStats;
  wpmData: WPMDataPoint[];
  textData: string | TextMeta;
  testConfig: TestConfig;
  userInput: string;
}) {
  const [record, setRecord] = useState("");
  const [error, setError] = useState("");
  const qt = useContext(QtContext);

  let mode: ToolsAtpTypingTest.Record["mode"];

  switch (testConfig.mode) {
    case "time":
      mode = {
        $type: "tools.atp.typing.test#timerMode",
        mode: "time",
        subMode: testConfig.selectedTimer,
      } as any;
      break;
    case "quotes":
      mode = {
        $type: "tools.atp.typing.test#quoteMode",
        mode: "quotes",
        subMode: testConfig.quoteLen as "short" | "medium" | "long" | "xl",
      };
      break;
    case "random":
      mode = {
        $type: "tools.atp.typing.test#textMode",
        mode: "text",
        subMode: testConfig.randomLen,
      } as any;
      break;
  }

  let textPrompted: ToolsAtpTypingTest.Record["textPrompted"];

  if (typeof textData === "string") {
    if (testConfig.mode === "time") {
      textPrompted = {
        $type: "tools.atp.typing.test#promptedTextOpen",
        text: textData,
        charsTyped: userInput.length,
      };
    }
    textPrompted = {
      $type: "tools.atp.typing.test#promptedTextClosed",
      text: textData,
    };
  } else {
    textPrompted = {
      $type: "tools.atp.typing.test#promptedTextWithSource",
      text: textData.text,
      source: textData.source || "No source",
    };
  }

  const result: ToolsAtpTypingTest.Record = {
    $type: "tools.atp.typing.test",
    mode,
    accuracy: Math.round(stats.accuracy),
    ratio: stats.charRatio,
    wpm: Math.round(stats.wpm),
    rawWpm: Math.round(stats.rawWpm),
    timeMs: Math.round(stats.time * 1000),
    consistency: Math.round(stats.consistency),
    textPrompted,
    dataPoints: wpmData.map((point) => ({
      time: Math.round(point.time * 1000),
      wpm: Math.round(point.wpm),
      errors: Math.round(point.errors || 0),
    })),
  };

  // submit once
  useEffect(() => {
    const submitExampleResult = async () => {
      console.log("Submitting result...");
      if (!qt) {
        console.error("QtContext is not available");
        return;
      }
      if (record !== "") return;
      try {
        if (qt.currentAgent) {
          let response = await qt.client.rpc.call(
            "com.atproto.repo.putRecord",
            {
              data: {
                rkey: generateTid().toString(),
                repo: qt.currentAgent.sub,
                record: result,
                collection: "tools.atp.typing.test",
              },
            },
          );
          console.log("Result submitted successfully");
          setRecord(response.data.uri);
        }
      } catch (err: any) {
        console.error("Error submitting result:", err);
        setError(err.toString());
      }
    };

    submitExampleResult();
  }, [qt]);

  if (error) {
    return (
      <div>
        <p>Error submitting result: {error}</p>
      </div>
    );
  }

  if (record !== "") {
    return (
      <button
        className="relative group max-h-5 h-5 min-h-5"
        onClick={() => {
          // copy at uri to clipboard
          navigator.clipboard.writeText(record);
        }}
      >
        <Check className="absolute top-0.5 group-hover:h-0 transition-all duration-150 text-green-500" />
        <Clipboard className="absolute top-0 group-hover:w-max mt-0.5 aspect-square group-hover:opacity-100 w-0 opacity-0 transition-all duration-150" />
      </button>
    );
  }

  return (
    <div>
      <Loader2 className="animate-spin" />
    </div>
  );
}

export function ResultsView({
  stats,
  wpmData,
  resetTest,
  textData,
  testConfig,
  userInput,
}: {
  stats: TypingStats;
  wpmData: WPMDataPoint[];
  resetTest: () => void;
  textData: string | TextMeta;
  testConfig: TestConfig;
  userInput: string;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  console.log(wpmData);

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
          {isSaving && (
            <div className="text-end">
              type@tools - {new Date().toLocaleString()}
            </div>
          )}
          <div className={isSaving ? "hidden" : ""}>
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
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <AutoSubmitStats
                  stats={stats}
                  testConfig={testConfig}
                  textData={textData}
                  userInput={userInput}
                  wpmData={wpmData}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        domain={[0, Math.max(...wpmData.map((d) => d.errors || 0), 1)]}
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
        dataKey="errors"
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
        <p className="text-sm text-red-500">errors: {data.errors}</p>
      </div>
    );
  }
  return null;
};
