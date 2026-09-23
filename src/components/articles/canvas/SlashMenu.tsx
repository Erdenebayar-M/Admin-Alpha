"use client";

import { autoUpdate, computePosition, type VirtualElement } from "@floating-ui/dom";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import type { SlashMenuStore } from "./slash-menu-store";

const noMenu = () => null;

/** The `/` menu: rendered by React, driven by the editor's suggestion plugin through `store`. */
export function SlashMenu({ store }: { store: SlashMenuStore }) {
  const menu = useSyncExternalStore(store.subscribe, store.getSnapshot, noMenu);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  // Re-positions (flip above/below, clamp horizontally, cap height) on every open/filter
  // update from the store, and again live via `autoUpdate` if the page scrolls or resizes
  // while the menu is open — the reference is a virtual element so it tracks the caret even
  // as `getRect()` moves (e.g. typing more of the query shifts it).
  useLayoutEffect(() => {
    const floating = menuRef.current;
    if (!menu || !floating) {
      setCoords(null);
      return;
    }
    const reference: VirtualElement = {
      getBoundingClientRect: () => menu.getRect() ?? new DOMRect(),
      contextElement: menu.contextElement ?? undefined,
    };
    const update = () =>
      computePosition(reference, floating, {
        placement: menu.floatingUi.placement,
        strategy: menu.floatingUi.strategy,
        middleware: menu.floatingUi.middleware,
      }).then(({ x, y }) => setCoords({ x, y }));

    return autoUpdate(reference, floating, update);
  }, [menu]);

  if (!menu) return null;

  return (
    <div
      ref={menuRef}
      role="listbox"
      aria-label="Блок нэмэх"
      className="fixed z-50 w-60 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      style={{ left: coords?.x ?? 0, top: coords?.y ?? 0, visibility: coords ? "visible" : "hidden" }}
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
