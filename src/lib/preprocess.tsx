import React from "preact/compat";

export function preprocessText(text: string): React.ReactNode[] {
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/g;

  // Split the text by URLs
  const parts = text.split(urlPattern);

  // Process each part and create React elements
  return parts.map((part, index) => {
    // Check if this part is a URL
    if (urlPattern.test(part)) {
      return (
        <a
          className="text-blue-700 dark:text-blue-400"
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
        >
          {part}
        </a>
      );
    }

    // Handle newlines in text parts
    if (part) {
      return part.split("\n").map((line, lineIndex, array) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < array.length - 1 && <br />}
        </React.Fragment>
      ));
    }

    return null;
  });
}
