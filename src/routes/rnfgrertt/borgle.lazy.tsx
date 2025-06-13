import { createLazyFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useContext } from "preact/compat";
import { QtContext } from "@/providers/qtprovider";
import { Check, Loader2, Clipboard } from "lucide-react";
import { generateTid, tidToTime } from "@/lib/tid";
import { timeAgo } from "@/lib/utils";

import { WORD_LIST, ACCEPTED_WORDS } from "@/lib/borgle-lists";
import { StateUpdater } from "preact/hooks";

export const Route = createLazyFileRoute("/rnfgrertt/borgle")({
  component: WordleClone,
});

// Type definitions
type EvaluationResult = "correct" | "present" | "absent";
type GameState = "playing" | "won" | "lost";
type KeyboardState = Record<string, EvaluationResult>;

interface GuessEvaluation {
  guess: string;
  evaluations: EvaluationResult[];
}

interface WordData {
  word: string;
  puzzleNumber: number;
  date: string;
}

type EvaluationsArray = (GuessEvaluation | null)[];

// AT Protocol record type for borgle playthrough
type BorglePlayRecord = {
  game: GuessEvaluation[];
};

function AutoSubmitPlaythrough({
  record,
  error,
  isSubmitting,
}: {
  record: string;
  error: string;
  isSubmitting: boolean;
}) {
  if (error) {
    return (
      <div className="text-red-500 text-xs">Error: {error.slice(0, 50)}...</div>
    );
  }

  if (record !== "") {
    return (
      <button
        className="relative group max-h-5 h-5 min-h-5"
        onClick={() => {
          navigator.clipboard.writeText(record);
        }}
        title="Copy AT URI to clipboard"
      >
        <Check className="absolute top-0.5 group-hover:h-0 transition-all duration-150 text-green-500" />
        <Clipboard className="absolute top-0 group-hover:w-max mt-0.5 aspect-square group-hover:opacity-100 w-0 opacity-0 transition-all duration-150" />
      </button>
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="animate-spin w-4 h-4" />
        <span className="text-xs text-gray-500">Submitting...</span>
      </div>
    );
  }

  return null;
}

// Simple seeded random number generator (LCG algorithm)
function seededRandom(seed: number): () => number {
  let state = seed;
  return function () {
    state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
    return state / Math.pow(2, 32);
  };
}

// Get word and puzzle number based on the current date
function getTodaysWordData(): WordData {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const startDate = new Date("2025-06-10T00:00:00Z"); // Reference start date in UTC
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Use the number of days as seed
  const rng = seededRandom(daysSinceStart);
  const index = Math.floor(rng() * WORD_LIST.length);

  return {
    word: WORD_LIST[index],
    puzzleNumber: daysSinceStart + 1, // Start from puzzle #1
    date: today.toISOString().split("T")[0], // Use UTC date
  };
}

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["BACKSPACE", "Z", "X", "C", "V", "B", "N", "M", "ENTER"],
];

function WordleClone() {
  const qt = useContext(QtContext);
  const [targetWord, setTargetWord] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>(Array(6).fill(""));
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [evaluations, setEvaluations] = useState<EvaluationsArray>(
    Array(6).fill(null),
  );
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({});
  const [, setAnimatingTiles] = useState<Set<string>>(new Set());
  const [revealedTiles, setRevealedTiles] = useState<Set<string>>(new Set());
  const [shakingRow, setShakingRow] = useState<number>(-1);
  const [, setRevealingRow] = useState<number>(-1);
  const [bouncingTiles, setBouncingTiles] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>("");
  const [puzzleNumber, setPuzzleNumber] = useState<number>(0);
  const [todaysDate, setTodaysDate] = useState<string>("");
  const [todaysSubmission, setTodaysSubmission] =
    useState<BorglePlayRecord | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState<boolean>(true);
  const [hasSubmittedToday, setHasSubmittedToday] = useState<boolean>(false);
  const [submissionRecord, setSubmissionRecord] = useState<string>("");
  const [submissionError, setSubmissionError] = useState<string>("");
  const [nextPuzzleTime, setNextPuzzleTime] = useState<string>("");

  // Initialize game
  useEffect(() => {
    if (!checkingSubmission && !todaysSubmission) {
      startNewGame();
    }
  }, [checkingSubmission, todaysSubmission]);

  // Update countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const nextMidnightUTC = new Date();
      nextMidnightUTC.setUTCDate(nextMidnightUTC.getUTCDate() + 1);
      nextMidnightUTC.setUTCHours(0, 0, 0, 0); // Set to UTC midnight

      setNextPuzzleTime(
        timeAgo(nextMidnightUTC, { future: true, useShortLabels: true }),
      );
    };

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Submit playthrough when game ends
  useEffect(() => {
    const submitPlaythrough = async () => {
      if (!qt || !qt.currentAgent) return;
      if (hasSubmittedToday || gameState === "playing") return;
      if (evaluations.filter((e) => e !== null).length === 0) return;

      try {
        setHasSubmittedToday(true);
        // Check if today's submission already exists (using UTC date)
        const now = new Date();
        const todayUTC = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
        const today = todayUTC.toISOString().split("T")[0];
        const response = await qt.client.rpc.get(
          "com.atproto.repo.listRecords",
          {
            params: {
              repo: qt.currentAgent.sub,
              collection: "tools.atp.borgle.play",
              limit: 50,
            },
          },
        );

        // Check if any submission from today exists
        const existingSubmission = response.data.records.find((record: any) => {
          if (!record.uri) return false;
          try {
            const rkey = record.uri.split("/").pop();
            if (!rkey) return false;
            const recordDate = tidToTime(rkey);
            return recordDate.toISOString().split("T")[0] === today;
          } catch (error) {
            return false;
          }
        });

        if (existingSubmission) {
          console.log("Today's submission already exists, skipping");
          setSubmissionRecord(existingSubmission.uri);
          setHasSubmittedToday(true);
          return;
        }

        // Convert evaluations to the lexicon format for submission
        const playthroughData: BorglePlayRecord = {
          game: evaluations
            .filter(
              (evaluation): evaluation is GuessEvaluation =>
                evaluation !== null,
            )
            .map((evaluation) => ({
              guess: evaluation.guess,
              evaluations: evaluation.evaluations,
            })),
        };

        // Create new record if none exists for today
        let createResponse = await qt.client.rpc.call(
          "com.atproto.repo.putRecord",
          {
            data: {
              rkey: generateTid().toString(),
              repo: qt.currentAgent.sub,
              record: playthroughData,
              collection: "tools.atp.borgle.play",
            },
          },
        );
        console.log("Playthrough submitted successfully");
        setSubmissionRecord(createResponse.data.uri);
        setHasSubmittedToday(true);
      } catch (err: any) {
        console.error("Error submitting playthrough:", err);
        setSubmissionError(err.toString());
      }
    };

    submitPlaythrough();
  }, [gameState]);

  // // Optional: Add debug info to see today's word (remove in production)
  // useEffect(() => {
  //   console.log("Today's word:", targetWord);
  // }, [targetWord]);

  const startNewGame = () => {
    const wordData = getTodaysWordData();
    setTargetWord(wordData.word);
    setPuzzleNumber(wordData.puzzleNumber);
    setTodaysDate(wordData.date);
    setGuesses(Array(6).fill(""));
    setCurrentGuess("");
    setCurrentRow(0);
    setGameState("playing");
    setEvaluations(Array(6).fill(null));
    setKeyboardState({});
    setAnimatingTiles(new Set());
    setRevealedTiles(new Set());
    setShakingRow(-1);
    setRevealingRow(-1);
    setBouncingTiles(new Set());
    setMessage("");
  };

  const checkTodaysSubmission = async (): Promise<void> => {
    if (!qt?.currentAgent) {
      setCheckingSubmission(false);
      return;
    }

    try {
      console.log("Checking submission");
      const wordData = getTodaysWordData();
      const now = new Date();
      const todayUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const today = todayUTC.toISOString().split("T")[0]; // YYYY-MM-DD format in UTC

      const response = await qt.client.rpc.get("com.atproto.repo.listRecords", {
        params: {
          repo: qt.currentAgent.sub,
          collection: "tools.atp.borgle.play",
          limit: 50, // Check recent submissions
        },
      });

      // Check if any submission from today exists
      const todaySubmission = response.data.records.find((record: any) => {
        if (!record.uri) return false;

        try {
          // Extract rkey from URI (format: at://did/collection/rkey)
          const rkey = record.uri.split("/").pop();
          if (!rkey) return false;

          console.log(rkey);

          // Decode timestamp from TID
          const recordDate = tidToTime(rkey);

          console.log(recordDate);

          return recordDate.toISOString().split("T")[0] === today;
        } catch (error) {
          console.warn("Error parsing TID from record:", record.uri, error);
          return false;
        }
      });

      if (todaySubmission) {
        setTodaysSubmission(
          todaySubmission.value as StateUpdater<BorglePlayRecord | null>,
        );
        // Set up the game state to show the completed game
        const playthrough = todaySubmission.value as BorglePlayRecord;
        const finalGameState =
          playthrough.game[playthrough.game.length - 1].guess === wordData.word
            ? "won"
            : "lost";

        setTargetWord(wordData.word);
        setPuzzleNumber(wordData.puzzleNumber);
        setTodaysDate(wordData.date);
        setGameState(finalGameState);

        // Convert playthrough back to evaluations format
        const newEvaluations: EvaluationsArray = Array(6).fill(null);
        playthrough.game.forEach((entry, index) => {
          newEvaluations[index] = {
            guess: entry.guess,
            evaluations: entry.evaluations,
          };
        });
        setEvaluations(newEvaluations);
        setCurrentRow(playthrough.game.length);
      }
    } catch (error) {
      console.error("Error checking today's submission:", error);
    } finally {
      setCheckingSubmission(false);
    }
  };

  // Check for today's submission first
  useEffect(() => {
    console.log("Checking");
    checkTodaysSubmission();
  }, []);

  const showMessage = (text: string, duration: number = 2000): void => {
    setMessage(text);
    setTimeout(() => setMessage(""), duration);
  };

  const evaluateGuess = (guess: string, target: string): EvaluationResult[] => {
    const result: EvaluationResult[] = Array(5).fill("absent");
    const targetChars: (string | null)[] = target.split("");
    const guessChars: (string | null)[] = guess.split("");

    // First pass: mark correct positions
    for (let i = 0; i < 5; i++) {
      if (guessChars[i] === targetChars[i]) {
        result[i] = "correct";
        targetChars[i] = null;
        guessChars[i] = null;
      }
    }

    // Second pass: mark present letters
    for (let i = 0; i < 5; i++) {
      if (guessChars[i] !== null) {
        const targetIndex = targetChars.indexOf(guessChars[i]);
        if (targetIndex !== -1) {
          result[i] = "present";
          targetChars[targetIndex] = null;
        }
      }
    }

    return result;
  };

  const submitGuess = (): void => {
    if (currentGuess.length !== 5) {
      showMessage("Not enough letters");
      setShakingRow(currentRow);
      setTimeout(() => setShakingRow(-1), 600);
      return;
    }

    if (
      !WORD_LIST.includes(currentGuess) &&
      !ACCEPTED_WORDS.includes(currentGuess)
    ) {
      showMessage("Not in word list");
      setShakingRow(currentRow);
      setTimeout(() => setShakingRow(-1), 600);
      return;
    }

    const newGuesses = [...guesses];
    newGuesses[currentRow] = currentGuess;
    setGuesses(newGuesses);

    const evaluation = evaluateGuess(currentGuess, targetWord);

    // Start reveal animation
    setRevealingRow(currentRow);

    // Animate each tile reveal with staggered timing
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        // Reveal color after flip animation completes (300ms)
        setTimeout(() => {
          setRevealedTiles((prev) => new Set([...prev, `${currentRow}-${i}`]));

          // Update evaluation for this specific tile
          setEvaluations((prevEvaluations) => {
            const newEvaluations = [...prevEvaluations];
            if (!newEvaluations[currentRow]) {
              newEvaluations[currentRow] = {
                guess: currentGuess,
                evaluations: Array(5).fill(null),
              };
            }
            newEvaluations[currentRow].evaluations[i] = evaluation[i];
            return newEvaluations;
          });

          // Update keyboard state for this letter
          const letter = currentGuess[i];
          const status = evaluation[i];
          setKeyboardState((prev) => {
            const newState = { ...prev };
            if (
              !newState[letter] ||
              (newState[letter] === "absent" && status !== "absent") ||
              (newState[letter] === "present" && status === "correct")
            ) {
              newState[letter] = status;
            }
            return newState;
          });

          // Stop flip animation
          setAnimatingTiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(`${currentRow}-${i}`);
            return newSet;
          });

          // Check if this is the last tile
          if (i === 4) {
            setTimeout(() => {
              setRevealingRow(-1);

              if (currentGuess === targetWord) {
                setGameState("won");
                showMessage("Excellent!", 5000);
                // Bounce winning tiles
                for (let j = 0; j < 5; j++) {
                  setTimeout(() => {
                    setBouncingTiles(
                      (prev) => new Set([...prev, `${currentRow}-${j}`]),
                    );
                  }, j * 100);
                }
                setTimeout(() => setBouncingTiles(new Set()), 1000);
              } else if (currentRow === 5) {
                setGameState("lost");
                showMessage(targetWord, 5000);
              } else {
                setCurrentRow(currentRow + 1);
              }

              setCurrentGuess("");
            }, 500);
          }
        }, 300);
      }, i * 150);
    }
  };

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== "playing") return;

      if (key === "ENTER") {
        submitGuess();
      } else if (key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (
        key.length === 1 &&
        key.match(/[A-Z]/) &&
        currentGuess.length < 5
      ) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess, currentRow, gameState, targetWord],
  );

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: { key: string }) => {
      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        handleKeyPress("BACKSPACE");
      } else if (e.key.match(/[a-zA-Z]/)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  const getTileClass = (rowIndex: number, colIndex: number): string => {
    const tileKey = `${rowIndex}-${colIndex}`;
    const baseClass =
      "tile w-16 h-16 border-2 flex items-center justify-center text-2xl font-bold transition-all duration-400";

    let classes = [baseClass];

    if (bouncingTiles.has(tileKey)) {
      classes.push("tile-bounce");
    }

    // Row shaking
    if (shakingRow === rowIndex) {
      classes.push("shake");
    }

    // Tile states based on game progress
    if (
      (rowIndex < currentRow || revealedTiles.has(tileKey)) &&
      evaluations[rowIndex] &&
      evaluations[rowIndex].evaluations[colIndex] !== null
    ) {
      const evaluation = evaluations[rowIndex].evaluations[colIndex];
      if (evaluation === "correct") {
        classes.push(
          "bg-green-400 dark:bg-green-600 border-green-500 text-white",
        );
      } else if (evaluation === "present") {
        classes.push(
          "bg-yellow-400 dark:bg-yellow-700 border-yellow-500 text-white",
        );
      } else {
        classes.push("bg-gray-400 dark:bg-gray-700 border-gray-400 text-white");
      }
      classes.push("tile-flip");
    } else {
      // Current or future rows
      const hasLetter =
        (rowIndex === currentRow && colIndex < currentGuess.length) ||
        (rowIndex < currentRow && colIndex < guesses[rowIndex].length);

      if (hasLetter) {
        classes.push("border-gray-400 bg-background");
        if (rowIndex === currentRow) {
          classes.push("tile-pop"); // Pop animation for new letters
        }
      } else {
        classes.push("border-gray-300 bg-background");
      }
    }

    return classes.join(" ");
  };

  const getKeyClass = (key: string): string => {
    const baseClass =
      "key font-semibold rounded cursor-pointer select-none transition-all duration-150 active:scale-95";
    const status = keyboardState[key];

    let classes = [baseClass];

    if (key === "ENTER" || key === "BACKSPACE") {
      classes.push(
        "px-2 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-800",
      );
    } else {
      classes.push(
        "w-7 h-8 md:w-10 md:h-12 flex items-center justify-center text-sm md:text-base font-bold",
      );

      if (status === "correct") {
        classes.push("bg-green-500 text-white");
      } else if (status === "present") {
        classes.push("bg-yellow-500 text-white");
      } else if (status === "absent") {
        classes.push("bg-gray-400 text-white");
      } else {
        classes.push("bg-gray-200 hover:bg-gray-300 text-gray-800");
      }
    }

    return classes.join(" ");
  };

  const renderGrid = () => {
    return (
      <div className="grid gap-1.5 mb-8">
        {Array(6)
          .fill(null)
          .map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-1.5">
              {Array(5)
                .fill(null)
                .map((_, colIndex) => {
                  let letter = "";
                  if (rowIndex < currentRow && evaluations[rowIndex]) {
                    letter = evaluations[rowIndex].guess[colIndex] || "";
                  } else if (rowIndex === currentRow) {
                    letter =
                      currentGuess[colIndex] ||
                      evaluations[rowIndex]?.guess[colIndex] ||
                      "";
                  }

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={getTileClass(rowIndex, colIndex)}
                    >
                      {letter}
                    </div>
                  );
                })}
            </div>
          ))}
      </div>
    );
  };

  const generateCurrentGameState = (): string => {
    let state = `Borgle Puzzle #${puzzleNumber}\n`;

    for (let res in evaluations) {
      const evalRow = evaluations[res];
      if (evalRow) {
        for (let char in evalRow.evaluations) {
          // get the emoji for the character based on its evaluation
          const emoji =
            evalRow.evaluations[char] === "correct"
              ? "🟩"
              : evalRow.evaluations[char] === "present"
                ? "🟨"
                : "⬜";
          state += emoji;
        }
        // if this row is the winning row add a confetti
        if (evalRow.guess === targetWord) state += " 🎉";
        state += `\n`;
      }
    }
    return state;
  };

  const renderKeyboard = () => {
    return (
      <div className="keyboard max-w-lg text-xs md:text-base">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 justify-center mb-2">
            {row.map((key) => (
              <button
                key={key}
                className={getKeyClass(key)}
                onClick={() => handleKeyPress(key)}
                disabled={gameState !== "playing"}
              >
                {key === "BACKSPACE" ? "⌫" : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Check authentication
  if (!qt?.currentAgent) {
    return (
      <div className="min-h-max flex flex-col items-center justify-center p-4 font-sans">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold tracking-wide mb-6">BORGLE</h1>
          <div className="text-lg text-muted-foreground mb-2">
            You'll need to log in to play Borgle, so we can track and save your
            progress.
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking for today's submission
  if (checkingSubmission) {
    return (
      <div className="flex flex-col items-center justify-center p-4 font-sans">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-wide mb-6">BORGLE</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="animate-spin w-5 h-5" />
            <span>Checking today's progress...</span>
          </div>
        </div>
      </div>
    );
  }

  if (todaysSubmission) {
    return (
      <div className="flex flex-col items-center justify-center p-4 font-sans">
        <style jsx>{`
          @keyframes flip {
            0% {
              transform: rotateX(0);
            }
            50% {
              transform: rotateX(90deg);
            }
            100% {
              transform: rotateX(0);
            }
          }

          .tile {
            position: relative;
          }
        `}</style>

        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold tracking-wide">BORGLE</h1>
            {puzzleNumber > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                Puzzle #{puzzleNumber} • {todaysDate} Zulu time
              </div>
            )}
          </div>

          <div className="text-center mb-6">
            <div className="text-lg font-semibold mb-2 text-blue-600 dark:text-blue-300">
              You already played today!
            </div>
            <div className="text-sm text-muted-foreground">
              {gameState === "won"
                ? `🎉 You solved it in ${currentRow} guess${currentRow === 1 ? "" : "es"}!`
                : `The word was: ${targetWord}`}
            </div>
          </div>

          {/* Game Grid */}
          <div className="flex justify-center mb-4">{renderGrid()}</div>

          <div className="text-center">
            <div className="text-sm text-gray-500 mb-4">
              Come back after midnight UTC ({nextPuzzleTime}) for the next
              puzzle!
            </div>
            <button
              onClick={() => {
                try {
                  navigator.clipboard.writeText(generateCurrentGameState());
                  showMessage("Results copied to clipboard!");
                } catch (error) {
                  showMessage("Couldn't copy results to clipboard");
                }
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Share Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-0 font-sans">
      <div className="w-full max-w-lg">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-foreground tracking-wide">
            BORGLE
          </h1>
          {puzzleNumber > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
              Puzzle #{puzzleNumber} • {todaysDate}
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 px-6 py-3 rounded font-semibold z-50 animate-pulse">
            {message}
          </div>
        )}
        <div className="flex justify-center">
          {/* Game Grid */}
          {renderGrid()}
        </div>
        {/* Game Over State */}
        {gameState !== "playing" ? (
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="text-xl font-semibold mb-4">
              {gameState === "won" ? (
                <span className="text-green-600">🎉 Congratulations!</span>
              ) : (
                <span className="text-gray-600">Game Over</span>
              )}
            </div>
            {gameState === "lost" && (
              <div className="text-lg mb-4">
                The word was:{" "}
                <span className="font-bold text-green-600">{targetWord}</span>
              </div>
            )}
            <div className="text-left max-w-max">
              {generateCurrentGameState()
                .split("\n")
                .map((line) => (
                  <div>{line}</div>
                ))}
            </div>
            <div className="flex gap-4 items-center mt-4">
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(generateCurrentGameState());
                  } catch (error) {
                    showMessage("Couldn't copy results to clipboard");
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Copy your results
              </button>
              <AutoSubmitPlaythrough
                record={submissionRecord}
                error={submissionError}
                isSubmitting={!hasSubmittedToday}
              />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Daily puzzle changes at midnight UTC ({nextPuzzleTime})
            </div>
          </div>
        ) : (
          renderKeyboard()
        )}

        {/* Instructions */}
        <div className="text-center mt-8 text-sm text-muted-foreground space-y-2">
          <p>guess the word in 6 tries.</p>
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white font-bold">
                A
              </div>
              <span>correct spot</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-white font-bold">
                T
              </div>
              <span>wrong spot</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-gray-400 rounded flex items-center justify-center text-white font-bold">
                P
              </div>
              <span>not in word</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WordleClone;
