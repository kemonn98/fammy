export const DEFAULT_REMIND_BEFORE_MINUTES = 30;

export const REMIND_BEFORE_OPTIONS = [
  { value: 0, label: "Saat acara dimulai" },
  { value: 15, label: "15 menit sebelumnya" },
  { value: 30, label: "30 menit sebelumnya" },
  { value: 60, label: "1 jam sebelumnya" },
  { value: 120, label: "2 jam sebelumnya" },
  { value: 1440, label: "1 hari sebelumnya" },
] as const;

export function formatRemindBefore(minutes: number | null): string {
  if (minutes === null) return "Tidak ada";
  const match = REMIND_BEFORE_OPTIONS.find((o) => o.value === minutes);
  if (match) return match.label;
  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? "1 hari sebelumnya" : `${days} hari sebelumnya`;
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 jam sebelumnya" : `${hours} jam sebelumnya`;
  }
  return `${minutes} menit sebelumnya`;
}
