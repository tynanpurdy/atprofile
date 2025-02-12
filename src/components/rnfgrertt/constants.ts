// constants.ts
import { TimerOption } from "./types";

export const UPDATE_INTERVAL = 250;
export const CHART_MARGIN = { top: 6, right: 30, left: 20, bottom: 2 };
export const TIMER_OPTIONS: readonly TimerOption[] = [15, 30, 60, 120] as const;
export const LINE_HEIGHT = 30;
export const VISIBLE_LINES = 3;
