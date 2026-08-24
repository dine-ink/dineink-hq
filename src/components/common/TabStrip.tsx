import type { ComponentType } from "react";

/**
 * The tab row used across the dashboard pages.
 *
 * On a phone it is a single swipeable row of pills — a wrapping strip of five
 * to seven tabs costs 3–5 stacked rows of vertical space before any content.
 * From `lg` up it wraps exactly as before, so desktop is unchanged in layout.
 *
 * Accepts plain strings, or `{ id, label, icon }` when the value stored in
 * state differs from the text shown (Settings, Branch Comparison).
 */
export type TabStripItem =
  | string
  | {
      id?: string;
      label: string;
      icon?: ComponentType<{ className?: string }>;
    };

const idOf = (tab: TabStripItem) =>
  typeof tab === "string" ? tab : (tab.id ?? tab.label);

const labelOf = (tab: TabStripItem) =>
  typeof tab === "string" ? tab : tab.label;

/**
 * Generic over the id type so pages declaring `TABS = [...] as const` keep
 * their narrow union in state instead of widening to `string`.
 */
export default function TabStrip<T extends string>({
  tabs,
  value,
  onChange,
  className = "",
}: {
  tabs: readonly TabStripItem[];
  /** The active tab's id (or its label, for plain string tabs). */
  value: T;
  // NoInfer keeps `T` pinned to `value`. Without it a `useState` setter in this
  // contravariant position drags inference back to the `string` constraint, and
  // pages with `TABS = [...] as const` stop type-checking.
  onChange: (id: NoInfer<T>) => void;
  className?: string;
}) {
  return (
    <div
      className={`hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 lg:mx-0 lg:flex-wrap lg:items-center lg:overflow-x-visible lg:px-0 lg:pb-0 ${className}`}
    >
      {tabs.map((tab) => {
        const id = idOf(tab);
        const label = labelOf(tab);
        const Icon = typeof tab === "string" ? undefined : tab.icon;
        const active = value === id;

        return (
          <button
            key={id}
            type="button"
            // The ids come from `tabs`, so this narrows back safely.
            onClick={() => onChange(id as NoInfer<T>)}
            aria-current={active ? "true" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap transition-all duration-200 lg:rounded-xl ${
              active
                ? "border-[#b10000] bg-[#b10000] text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
