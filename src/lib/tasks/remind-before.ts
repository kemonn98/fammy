export const DEFAULT_REMIND_BEFORE_MINUTES = 30;

export const REMIND_BEFORE_OPTIONS = [
  { value: 0, label: "When event starts" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
] as const;

export function formatRemindBefore(minutes: number | null): string {
  if (minutes === null) return "None";
  const match = REMIND_BEFORE_OPTIONS.find((o) => o.value === minutes);
  if (match) return match.label;
  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? "1 day before" : `${days} days before`;
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour before" : `${hours} hours before`;
  }
  return `${minutes} minutes before`;
}
