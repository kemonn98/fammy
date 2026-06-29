"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Capitalizes the first letter of each word, but only for characters that were
 * just typed (insertion). Deleting or editing existing text never re-applies
 * capitalization, so e.g. removing the leading "T" from "Tesk Awal" leaves
 * "esk Awal" untouched. The caret position is preserved after the update.
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
    const nextValue = e.target.value;
    const cursor = e.target.selectionStart ?? nextValue.length;
    caret.current = cursor;

    // Only capitalize when characters were inserted (typing forward), and only
    // within the inserted range. Deletions/edits are left as-is.
    if (nextValue.length > value.length) {
      const insertStart = Math.max(0, cursor - (nextValue.length - value.length));
      const chars = [...nextValue];
      for (let i = insertStart; i < cursor; i++) {
        const prev = chars[i - 1];
        const isWordStart = i === 0 || (prev !== undefined && /\s/.test(prev));
        if (isWordStart && chars[i]) {
          chars[i] = chars[i].toUpperCase();
        }
      }
      setValue(chars.join(""));
      return;
    }

    setValue(nextValue);
  }

  return { ref, onChange };
}
