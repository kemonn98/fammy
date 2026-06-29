"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Capitalizes only the very first letter of the field, and only when it was
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

    // Only capitalize the first character of the field, and only when it was
    // just inserted (typing forward). Deletions/edits are left as-is.
    if (nextValue.length > value.length) {
      const insertStart = cursor - (nextValue.length - value.length);
      if (insertStart === 0 && nextValue[0]) {
        setValue(nextValue[0].toUpperCase() + nextValue.slice(1));
        return;
      }
    }

    setValue(nextValue);
  }

  return { ref, onChange };
}
