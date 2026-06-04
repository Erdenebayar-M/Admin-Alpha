"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const NONE_VALUE = "__none__";

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function SuggestInput({
  value,
  onChange,
  placeholder,
  suggestions,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suggestions: string[];
  className?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      <div className="flex flex-wrap gap-1">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-all",
              value === s
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-dashed border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {value === s ? "✓ " : "+ "}
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SuggestTextarea({
  value,
  onChange,
  placeholder,
  suggestions,
  rows = 2,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suggestions: string[];
  rows?: number;
  className?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn("resize-y", className)}
      />
      <div className="flex flex-wrap gap-1">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-all",
              value === s
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-dashed border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {value === s ? "✓ " : "+ "}
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChipInput({
  value,
  onChange,
  placeholder = "Сонголт нэмэх...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const items = value ? value.split("\n").filter((s) => s.trim() !== "") : [];

  const add = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onChange([...items, trimmed].join("\n"));
    setDraft("");
  };

  const remove = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i).join("\n"));
  };

  return (
    <div
      className="min-h-[72px] cursor-text rounded-md border border-input bg-background px-3 py-2 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-sm font-medium"
          >
            {item}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(i); }}
              className="ml-0.5 text-muted-foreground transition-colors hover:text-foreground leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            }
            if (e.key === "Backspace" && draft === "" && items.length > 0) {
              remove(items.length - 1);
            }
          }}
          onBlur={() => { if (draft.trim()) add(draft); }}
          placeholder={items.length === 0 ? placeholder : "нэмэх..."}
          className="flex-1 min-w-[100px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground/60">
        Enter эсвэл таслал дарж нэмнэ · Backspace-ээр арилгана
      </p>
    </div>
  );
}

export function ComboSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value === "" ? NONE_VALUE : value}
      onValueChange={(v) => onChange(v === NONE_VALUE ? "" : v)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value || NONE_VALUE} value={o.value || NONE_VALUE}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
