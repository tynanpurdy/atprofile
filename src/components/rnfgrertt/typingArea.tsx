import { useRef, useEffect } from "preact/hooks";
import { TIMER_OPTIONS } from "./constants";
import { TimerOption } from "./types";
import { ComponentChild, VNode } from "preact";

export const TypingArea = ({
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
}: {
  userInput: string;
  handleInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  sampleText: string;
  selectedMode: "random" | "quotes" | "time";
  onSelectMode: (mode: "random" | "quotes" | "time") => void;
  selectedTime: TimerOption | null;
  onSelectTime: (time: TimerOption) => void;
  timeRemaining: number | null;
  selectedQuoteLen: "short" | "med" | "long";
  onSelectQuoteLen: (len: "short" | "med" | "long") => void;
  randomTextLen: TimerOption | null;
  onSelectRandomTextLen: (time: TimerOption) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="m-auto flex-1 relative rounded-lg max-w-2xl">
      <div className="flex gap-4 justify-between align-middle h-full">
        <div className="flex gap-4">
          <SelectorButtons
            options={["random", "quotes", "time"] as const}
            selected={selectedMode}
            onSelect={(option) =>
              onSelectMode(option as "random" | "quotes" | "time")
            }
          />
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
                onSelectQuoteLen(option as "short" | "med" | "long")
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
      <div className="max-h-[70vh] overflow-y-auto bg-muted p-4 rounded-lg">
        <TextDisplay userInput={userInput} sampleText={sampleText} />
        <textarea
          ref={textareaRef}
          className="absolute top-12 left-0 w-full h-full p-4 resize-none bg-transparent text-transparent caret-transparent outline-none"
          value={userInput}
          onChange={handleInput}
          spellcheck={false}
          autoCorrect="off"
          autocapitalize="off"
        />
      </div>
    </div>
  );
};

const TextDisplay = ({
  userInput,
  sampleText,
}: {
  userInput: string;
  sampleText: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const LINE_HEIGHT = 30;
  const VISIBLE_LINES = 3;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const currentCharIndex = userInput.length;
    const spans = container.children;
    if (currentCharIndex >= spans.length) return;

    const currentSpan = spans[currentCharIndex] as HTMLElement;
    const spanOffsetTop = currentSpan.offsetTop;
    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const desiredScrollTop = Math.min(
      Math.max(0, spanOffsetTop - LINE_HEIGHT),
      maxScrollTop,
    );

    container.scrollTop = desiredScrollTop;
  }, [userInput.length, sampleText]);

  return (
    <div
      className="relative overflow-hidden text-base"
      style={{ height: `${LINE_HEIGHT * VISIBLE_LINES}px` }}
    >
      <div
        ref={containerRef}
        style={{ height: `${LINE_HEIGHT * VISIBLE_LINES}px` }}
        className="whitespace-pre-wrap break-words text-xl leading-[30px] absolute w-full transition-transform duration-100 overflow-y-scroll scrollbar-hide"
      >
        {sampleText
          .split("")
          .map(
            (
              char:
                | string
                | number
                | bigint
                | boolean
                | object
                | ComponentChild[]
                | VNode<any>
                | null
                | undefined,
              i: number,
            ) => (
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
              ${i === userInput.length ? "bg-muted animate-blink" : ""}
            `}
              >
                {char}
              </span>
            ),
          )}
      </div>
    </div>
  );
};

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
