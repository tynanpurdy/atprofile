// utils/textGenerator.ts
import { WORD_LIST } from "@/lib/wordList";
import engQuotes from "@/lib/quotes/english.json";

export const generateWords = (count: number): string => {
  return (
    Array(count)
      .fill(0)
      .map(() => WORD_LIST.en[Math.floor(Math.random() * WORD_LIST.en.length)])
      .join(" ") + " "
  );
};

export const getRandomText = (length: "short" | "med" | "long") => {
  let minLen = 0;
  let maxLen = 0;

  switch (length) {
    case "short":
      minLen = 50;
      maxLen = 100;
      break;
    case "med":
      minLen = 100;
      maxLen = 200;
      break;
    case "long":
      minLen = 200;
      maxLen = 400;
      break;
  }

  let quoteSelection = engQuotes.quotes.filter(
    (q) => q.length >= minLen && q.length <= maxLen,
  );

  if (quoteSelection.length === 0) {
    quoteSelection = engQuotes.quotes.filter(
      (q) => q.length >= 100 && q.length <= 200,
    );
  }

  return quoteSelection[Math.floor(Math.random() * quoteSelection.length)];
};
