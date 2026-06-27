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
