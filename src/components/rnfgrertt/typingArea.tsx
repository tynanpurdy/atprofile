import { useRef, useEffect, useState } from "preact/hooks";
import { TIMER_OPTIONS } from "./constants";
import { CursorStyle, TimerOption } from "./types";
import { KbdKey } from "../ui/kbdKey";
import { isOnMac } from "../smartSearchBar";

export function TypingArea({
  userInput,
  handleInput,
  sampleText,
  selectedMode,
  onSelectMode,
  selectedTime,
  onSelectTime,
  timeRemaining,
  selectedQuoteLen,
  onSelectQuoteLen,
  randomTextLen,
  onSelectRandomTextLen,
  cursorStyle = "block",
}: {
  userInput: string;
  handleInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  sampleText: string;
  selectedMode: "random" | "quotes" | "time";
  onSelectMode: (mode: "random" | "quotes" | "time") => void;
  selectedTime: TimerOption | null;
  onSelectTime: (time: TimerOption) => void;
  timeRemaining: number | null;
  selectedQuoteLen: "short" | "med" | "long" | "xl";
  onSelectQuoteLen: (len: "short" | "med" | "long" | "xl") => void;
  randomTextLen: TimerOption | null;
  onSelectRandomTextLen: (time: TimerOption) => void;
  cursorStyle: CursorStyle;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [sampleText]);

  return (
    <div className="flex flex-col flex-auto">
      <div className="m-auto flex-1 relative rounded-lg max-w-2xl w-full flex flex-col justify-center">
        <div className="flex gap-4 justify-between align-middle h-min">
          <div className="flex gap-4">
            <SelectorButtons
              options={["random", "quotes", "time"] as const}
              selected={selectedMode}
              onSelect={(option) =>
                onSelectMode(option as "random" | "quotes" | "time")
              }
            />
            <div className="place-self-center w-8 border-t-2 h-[40%] -mr-4" />
            {selectedMode === "time" ? (
              <SelectorButtons
                options={[...TIMER_OPTIONS]}
                selected={selectedTime}
                onSelect={(option) => onSelectTime(option as TimerOption)}
                suffix="s"
              />
            ) : selectedMode === "quotes" ? (
              <SelectorButtons
                options={["short", "med", "long"] as const}
                selected={selectedQuoteLen}
                onSelect={(option) =>
                  onSelectQuoteLen(option as "short" | "med" | "long" | "xl")
                }
              />
            ) : (
              <SelectorButtons
                options={[...TIMER_OPTIONS]}
                selected={randomTextLen}
                onSelect={(option) =>
                  onSelectRandomTextLen(option as TimerOption)
                }
              />
            )}
          </div>
          <div className="my-auto pb-4">{timeRemaining?.toFixed(0)}</div>
        </div>
        <div className="relative overflow-y-visible bg-muted p-4 rounded-lg h-min max-h-max">
          <TextDisplay
            userInput={userInput}
            sampleText={sampleText}
            cursorStyle={cursorStyle}
          />
          <textarea
            ref={textareaRef}
            className="absolute top-0 left-0 w-full h-full p-4 resize-none bg-transparent text-transparent caret-transparent select-none outline-none scrollbar-hide"
            value={userInput}
            onChange={handleInput}
            spellcheck={false}
            autoCorrect="off"
            autocapitalize="off"
          />
        </div>
      </div>
      <div className="text-muted-foreground text-sm flex align-middle gap-1 ml-4">
        <KbdKey keys={[isOnMac() ? "cmd" : "ctrl", "h"]} />
        <div className="mt-0.5">for help</div>
      </div>
    </div>
  );
}

function TextDisplay({
  userInput,
  sampleText,
  cursorStyle = "block",
}: {
  userInput: string;
  sampleText: string;
  cursorStyle?: CursorStyle;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ left: 0, top: 0 });
  const LINE_HEIGHT = 30;
  const VISIBLE_LINES = 3;

  const getCursorStyles = (currentSpan: HTMLElement) => {
    const spanRect = currentSpan.getBoundingClientRect();

    switch (cursorStyle) {
      case "block":
        return {
          width: `${spanRect.width + 0.5}px`,
          height: `${spanRect.height}px`,
          backgroundColor: "hsl(0 0 100)",
          mixBlendMode: "difference",
        };
      case "line":
        return {
          width: "2px",
          height: `${spanRect.height}px`,
          backgroundColor: "hsl(0 0 100)",
          mixBlendMode: "difference",
        };
      case "underline":
        return {
          width: `${spanRect.width}px`,
          height: "2px",
          backgroundColor: "hsl(0 0 100)",
          mixBlendMode: "difference",
        };
      default:
        return {};
    }
  };

  const getTopOffset = () => {
    if (cursorStyle == "underline") return LINE_HEIGHT - 6;
    else return 0;
  };

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    console.log("resetting anim");

    // Reset animation
    cursor.style.animation = "none";
    cursor.offsetHeight;
    cursor.style.animation =
      cursorStyle === "block"
        ? "blink 1s ease-in-out infinite"
        : "blink 1s ease-in-out infinite";
  }, [cursorPosition, cursorStyle]);

  // Update cursor position when input changes
  useEffect(() => {
    const container = containerRef.current;
    const cursor = cursorRef.current;
    if (!container || !cursor) return;

    const currentCharIndex = userInput.length;
    const spans = container.children;

    // Skip the cursor element itself when getting spans
    const textSpans = Array.from(spans).filter((span) => span !== cursor);

    if (currentCharIndex >= textSpans.length) return;

    const currentSpan = textSpans[currentCharIndex] as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const spanRect = currentSpan.getBoundingClientRect();

    // Position cursor relative to container
    const relativeLeft = spanRect.left - containerRect.left;
    const relativeTop = spanRect.top - containerRect.top;

    // force cursor rerender
    setCursorPosition({ left: relativeLeft, top: relativeTop });

    // Apply cursor styles
    const cursorStyles = getCursorStyles(currentSpan);
    Object.assign(cursor.style, {
      left: `${relativeLeft}px`,
      top: `${currentSpan.offsetTop + getTopOffset()}px`,
      ...cursorStyles,
    });

    // Handle scrolling
    const spanOffsetTop = currentSpan.offsetTop;
    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const desiredScrollTop = Math.min(Math.max(0, spanOffsetTop), maxScrollTop);

    container.scrollTop = desiredScrollTop;
  }, [userInput.length, sampleText, cursorStyle]);

  return (
    <div
      className="relative overflow-hidden text-base"
      style={{ height: `${LINE_HEIGHT * VISIBLE_LINES}px` }}
    >
      <div
        ref={containerRef}
        style={{ height: `${LINE_HEIGHT * VISIBLE_LINES}px` }}
        className="whitespace-pre-wrap break-words text-xl leading-[30px] absolute w-full transition-transform duration-100 overflow-y-hidden scrollbar-hide"
      >
        {/* Cursor */}
        <div
          ref={cursorRef}
          className="absolute w-[2px] transition-all duration-100 animate-blink"
          style={{
            left: 0,
            top: 0,
            height: "24px",
          }}
        />

        {sampleText.split("").map((char, i) => (
          <span
            key={i}
            className={`
              ${
                i < userInput.length
                  ? userInput[i] === char
                    ? "text-green-500"
                    : "text-red-500 underline"
                  : ""
              }
            `}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}

const SelectorButtons = ({
  options,
  selected,
  onSelect,
  suffix = "",
}: {
  options: (string | number)[];
  selected: string | number | null;
  onSelect: (option: string | number) => void;
  suffix?: string;
}) => (
  <div className="flex gap-4 mb-4 divide-x">
    {options.map((option) => (
      <button
        key={option}
        className={`pl-4 rounded ${
          selected === option
            ? "text-primary underline"
            : "text-muted-foreground"
        }`}
        onClick={() => onSelect(option)}
      >
        {option}
        {suffix}
      </button>
    ))}
  </div>
);
