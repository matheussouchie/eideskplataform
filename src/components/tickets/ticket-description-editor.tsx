"use client";

import { useRef } from "react";

type TicketDescriptionEditorProps = {
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

const snippets = [
  { label: "Negrito", prefix: "**", suffix: "**" },
  { label: "Lista", prefix: "- ", suffix: "" },
  { label: "Checklist", prefix: "- [ ] ", suffix: "" },
];

export function TicketDescriptionEditor({
  name,
  onChange,
  placeholder,
  value,
}: TicketDescriptionEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const applySnippet = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);
    const nextValue = `${value.slice(0, start)}${prefix}${selectedText}${suffix}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + prefix.length;
      const cursorEnd = cursorStart + selectedText.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
        {snippets.map((snippet) => (
          <button
            key={snippet.label}
            type="button"
            onClick={() => applySnippet(snippet.prefix, snippet.suffix)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-300"
          >
            {snippet.label}
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        name={name}
        rows={12}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-none bg-white px-4 py-4 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </div>
  );
}
