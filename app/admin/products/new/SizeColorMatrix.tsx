"use client";

import type { ColorOption } from "./ColorPicker";

export default function SizeColorMatrix({
  sizes,
  colors,
  unavailable,
  onChange,
}: {
  sizes: string[];
  colors: ColorOption[];
  unavailable: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
}) {
  if (sizes.length === 0 || colors.length === 0) return null;

  function toggle(size: string, colorName: string) {
    const off = unavailable[size] ?? [];
    const next = off.includes(colorName)
      ? off.filter((n) => n !== colorName)
      : [...off, colorName];
    onChange({ ...unavailable, [size]: next });
  }

  return (
    <div>
      <label className="block font-medium mb-1">
        Colors available in each size
      </label>
      <p className="text-sm text-gray-600 mb-3">
        Every color is on for every size at first. Tap a color to turn it off
        for that size.
      </p>

      <div className="space-y-3">
        {sizes.map((size) => {
          const off = unavailable[size] ?? [];
          const onCount = colors.filter((c) => !off.includes(c.name)).length;

          return (
            <div key={size} className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold">Size {size}</p>
                <p className="text-xs text-gray-500">
                  {onCount} of {colors.length} colors
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const isOn = !off.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => toggle(size, c.name)}
                      aria-pressed={isOn}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 ${
                        isOn
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-400 border-gray-300 line-through"
                      }`}
                    >
                      <span
                        className="color-dot"
                        style={{
                          background: c.hex,
                          opacity: isOn ? 1 : 0.4,
                        }}
                      />
                      {c.name}
                    </button>
                  );
                })}
              </div>

              {onCount === 0 && (
                <p className="mt-2 text-sm text-red-600">
                  No color is available in this size, so customers cannot order
                  it. Turn on a color or remove the size.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}