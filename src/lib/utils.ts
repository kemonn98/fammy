import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export const APP_TIME_ZONE = process.env.APP_TIMEZONE ?? "Asia/Jakarta";

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function getZonedParts(date: Date, timeZone: string = APP_TIME_ZONE): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  let hour = get("hour");
  if (hour === 24) hour = 0;
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
    second: get("second"),
  };
}

/** Current date in the app timezone formatted as yyyy-MM-dd. */
export function todayInAppTz(now: Date = new Date()): string {
  const p = getZonedParts(now);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Current wall-clock hour/minute in the app timezone. */
export function nowPartsInAppTz(now: Date = new Date()): {
  hour: number;
  minute: number;
} {
  const p = getZonedParts(now);
  return { hour: p.hour, minute: p.minute };
}

function tzOffsetMs(date: Date, timeZone: string): number {
  const p = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

/**
 * Convert a wall-clock date/time in the app timezone to a UTC timestamp (ms).
 * `dateStr` is yyyy-MM-dd and `timeStr` is HH:mm.
 */
export function zonedDateTimeToUtcMs(
  dateStr: string,
  timeStr: string,
  timeZone: string = APP_TIME_ZONE,
): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const offset = tzOffsetMs(new Date(utcGuess), timeZone);
  return utcGuess - offset;
}

export function parseAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export function getPartnerEmail(currentEmail: string): string | null {
  const allowed = parseAllowedEmails();
  return allowed.find((e) => e !== currentEmail) ?? null;
}

export function assigneeLabel(
  assignee: string,
  currentEmail: string,
): string {
  if (assignee === "both") return "Keduanya";
  if (assignee === currentEmail) return "Kamu";
  const partner = getPartnerEmail(currentEmail);
  if (partner && assignee === partner) return "Pasangan";
  return assignee;
}
