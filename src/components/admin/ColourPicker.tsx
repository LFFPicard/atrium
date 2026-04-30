'use client';

import { useRef } from 'react';

interface ColourPickerProps {
  label: string;
  value: string;
  isOverridden: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}

export default function ColourPicker({ label, value, isOverridden, onChange, onReset }: ColourPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-8 h-8 rounded-md border-2 border-(--color-border) shrink-0 cursor-pointer hover:border-(--color-accent) transition-colors"
        style={{ backgroundColor: value }}
        aria-label={`Pick colour for ${label}`}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-(--color-text-muted) mb-0.5">{label}</div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          onBlur={(e) => {
            if (!/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(value);
          }}
          className="w-full bg-(--color-surface) border border-(--color-border) rounded px-2 py-0.5 text-xs font-mono text-(--color-text) focus:outline-none focus:border-(--color-accent)"
          maxLength={7}
        />
      </div>
      {isOverridden && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-(--color-text-muted) hover:text-(--color-text) transition-colors shrink-0 px-1.5 py-0.5 rounded border border-(--color-border) hover:border-(--color-accent)"
          title="Reset to theme default"
        >
          Reset
        </button>
      )}
    </div>
  );
}
