const INTERVAL_MINUTES = 30;

export function buildTimeOptions(intervalMinutes = INTERVAL_MINUTES): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      options.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      );
    }
  }
  return options;
}

export const TIME_OPTIONS = buildTimeOptions();
