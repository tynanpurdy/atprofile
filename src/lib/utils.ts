import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
type TimeUnit =
  | "year"
  | "month"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second";

interface TimeInterval {
  seconds: number;
  label: TimeUnit;
}

interface TimeagoOptions {
  maxUnit?: TimeUnit;
  minUnit?: TimeUnit;
  future?: boolean;
  useShortLabels?: boolean;
}

export function timeAgo(
  date: Date | string | number,
  options: TimeagoOptions = {},
): string {
  const {
    maxUnit = "year",
    minUnit = "second",
    future = true,
    useShortLabels = false,
  } = options;

  const currentDate = new Date();
  const targetDate = new Date(date);

  const seconds = Math.floor(
    (currentDate.getTime() - targetDate.getTime()) / 1000,
  );
  const isFuture = seconds < 0;
  const absoluteSeconds = Math.abs(seconds);

  const intervals: TimeInterval[] = [
    { seconds: 31536000, label: "year" },
    { seconds: 2592000, label: "month" },
    { seconds: 604800, label: "week" },
    { seconds: 86400, label: "day" },
    { seconds: 3600, label: "hour" },
    { seconds: 60, label: "minute" },
    { seconds: 1, label: "second" },
  ];

  // Short labels mapping
  const shortLabels: Record<TimeUnit, string> = {
    year: "y",
    month: "mo",
    week: "w",
    day: "d",
    hour: "h",
    minute: "m",
    second: "s",
  };

  // Handle future dates if not allowed
  if (isFuture && !future) {
    return "in the future";
  }

  // Handle just now
  if (absoluteSeconds < 30 && minUnit === "second") {
    return "just now";
  }

  // Filter intervals based on max and min units
  const filteredIntervals = intervals.filter((interval) => {
    const unitIndex = intervals.findIndex((i) => i.label === interval.label);
    const maxUnitIndex = intervals.findIndex((i) => i.label === maxUnit);
    const minUnitIndex = intervals.findIndex((i) => i.label === minUnit);
    return unitIndex >= maxUnitIndex && unitIndex <= minUnitIndex;
  });

  for (const { seconds: secondsInUnit, label } of filteredIntervals) {
    const interval = Math.floor(absoluteSeconds / secondsInUnit);

    if (interval >= 1) {
      const unitLabel = useShortLabels ? shortLabels[label] : label;
      const plural = interval === 1 ? "" : "s";
      const timeLabel = `${interval}${useShortLabels ? "" : " "}${unitLabel}${useShortLabels ? "" : plural}`;

      return isFuture ? `in ${timeLabel}` : `${timeLabel} ago`;
    }
  }

  return "just now";
}
