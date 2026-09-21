"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import type { SlashMenuStore } from "./slash-menu-store";

const noMenu = () => null;

/** The `/` menu: rendered by React, driven by the editor's suggestion plugin through `store`. */
export function SlashMenu({ store }: { store: SlashMenuStore }) {
  const menu = useSyncExternalStore(store.subscribe, store.getSnapshot, noMenu);
  if (!menu?.rect) return null;

  return (
    <div
      role="listbox"
      aria-label="Блок нэмэх"
      className="fixed z-50 w-60 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      style={{ left: menu.rect.left, top: menu.rect.bottom + 6 }}
    >
      {menu.items.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">Тохирох блок алга</p>
      ) : (
        menu.items.map((item, i) => (
          <button
            key={item.key}
            type="button"
            role="option"
            aria-selected={i === menu.selected}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => store.highlight(i)}
            onClick={() => menu.select(item)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
              i === menu.selected ? "bg-muted text-foreground" : "text-foreground/80",
            )}
          >
            <item.icon className="size-4 text-muted-foreground" />
            {item.label}
          </button>
        ))
      )}
    </div>
  );
}
