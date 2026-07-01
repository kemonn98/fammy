const DEFAULT_TIMEOUT_MS = 20_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const parentSignal = init?.signal;
  if (parentSignal) {
    if (parentSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      parentSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Permintaan jaringan habis waktu");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
