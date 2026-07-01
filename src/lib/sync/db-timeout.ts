import { recoverDb } from "@/lib/db";

const DB_TIMEOUT_MS = 8_000;

export async function withDbTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = DB_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Database timeout")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export async function withDbRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await withDbTimeout(operation);
  } catch (error) {
    console.warn("IndexedDB slow or stuck, recovering:", error);
    await recoverDb();
    return withDbTimeout(operation);
  }
}
