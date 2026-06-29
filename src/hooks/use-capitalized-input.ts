"use client";

import { useLayoutEffect, useRef } from "react";
import { capitalizeWords } from "@/lib/utils";

/**
 * Capitalizes each word's first letter on input while preserving the caret
 * position. Without this, transforming the controlled value on every keystroke
 * makes React reset the caret to the end of the field.
 */
export function useCapitalizedInput<T extends HTMLInputElement>(
  value: string,
  setValue: (next: string) => void,
) {
  const ref = useRef<T>(null);
  const caret = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caret.current !== null && ref.current) {
      ref.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [value]);

  function onChange(e: React.ChangeEvent<T>) {
    caret.current = e.target.selectionStart;
    setValue(capitalizeWords(e.target.value));
  }

  return { ref, onChange };
}
