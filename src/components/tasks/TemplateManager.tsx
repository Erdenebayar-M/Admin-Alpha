"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormState, TaskTemplate } from "@/hooks/useTaskForm";
import { TASK_TYPE_INFO } from "@/lib/task-defaults";

const STORAGE_KEY = "task_templates";
const NONE = "__none__";

// localStorage-backed store consumed via useSyncExternalStore so reads are
// SSR-safe (stable empty server snapshot) without a setState-in-effect.
const SERVER_SNAPSHOT: TaskTemplate[] = [];
let cache: TaskTemplate[] | null = null;
const listeners = new Set<() => void>();

function loadTemplates(): TaskTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TaskTemplate[]) : [];
  } catch {
    return [];
  }
}

function subscribeTemplates(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getTemplatesSnapshot(): TaskTemplate[] {
  if (cache === null) cache = loadTemplates();
  return cache;
}

function getServerSnapshot(): TaskTemplate[] {
  return SERVER_SNAPSHOT;
}

function saveTemplates(templates: TaskTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch { /* non-critical */ }
  cache = templates;
  listeners.forEach((l) => l());
}

interface TemplateManagerProps {
  onLoadTemplate: (template: TaskTemplate) => void;
  onDuplicateLast: () => boolean;
  currentForm: FormState;
  showSaveOption: boolean;
}

export function TemplateManager({
  onLoadTemplate,
  onDuplicateLast,
  currentForm,
  showSaveOption,
}: TemplateManagerProps) {
  const templates = useSyncExternalStore(
    subscribeTemplates,
    getTemplatesSnapshot,
    getServerSnapshot,
  );
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const handleLoad = useCallback(
    (id: string) => {
      if (id === NONE) return;
      const tpl = templates.find((t) => t.id === id);
      if (tpl) onLoadTemplate(tpl);
    },
    [templates, onLoadTemplate],
  );

  const handleDelete = useCallback((id: string) => {
    const next = templates.filter((t) => t.id !== id);
    saveTemplates(next);
  }, [templates]);

  const handleSave = useCallback(() => {
    if (!templateName.trim() || !currentForm.task_type) return;
    const tpl: TaskTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      created_at: new Date().toISOString(),
      task_type: currentForm.task_type,
      grade_band: currentForm.grade_band,
      primary_skill: currentForm.primary_skill,
      secondary_skill: currentForm.secondary_skill,
      level_target: currentForm.level_target,
      difficulty: currentForm.difficulty,
      lesson_slot_fit: currentForm.lesson_slot_fit,
      error_targets: currentForm.error_targets,
      estimated_time_seconds: currentForm.estimated_time_seconds,
    };
    const next = [tpl, ...templates];
    saveTemplates(next);
    setTemplateName("");
    setSaving(false);
  }, [templateName, currentForm, templates]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {templates.length > 0 && (
          <Select value={NONE} onValueChange={handleLoad}>
            <SelectTrigger className="w-[220px] h-8 text-xs">
              <SelectValue placeholder="Загвараас эхлэх…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE} disabled>Загвар сонгох…</SelectItem>
              {templates.map((t) => {
                const info = TASK_TYPE_INFO[t.task_type];
                return (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[9px] px-1">
                        {info?.shortLabel ?? t.task_type}
                      </Badge>
                      {t.name}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}

        {showSaveOption && !saving && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setSaving(true)}
          >
            Загвараар хадгалах
          </Button>
        )}
      </div>

      {saving && (
        <div className="flex items-center gap-2">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Загврын нэр..."
            className="h-8 w-[200px] text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button type="button" size="sm" className="h-8 text-xs" onClick={handleSave} disabled={!templateName.trim()}>
            Хадгалах
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSaving(false)}>
            Болих
          </Button>
        </div>
      )}

      {templates.length > 0 && saving && (
        <div className="flex flex-wrap gap-1.5">
          {templates.map((t) => (
            <Badge key={t.id} variant="outline" className="gap-1 text-xs">
              {t.name}
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
