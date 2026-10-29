"use client";

import { useState } from "react";

export type ColorOption = { name: string; hex: string };

const PRESETS: ColorOption[] = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#111111" },
  { name: "Green", hex: "#2E7D4F" },
  { name: "Golden", hex: "#C9A227" },
];

const MAX_COLORS = 8;

export default function ColorPicker({
  value,
  onChange,
}: {
  value: ColorOption[];
  onChange: (colors: ColorOption[]) => void;
}) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#A8575C");
  const [error, setError] = useState("");

  function has(colorName: string) {
    return value.some((c) => c.name.toLowerCase() === colorName.toLowerCase());
  }

  const customs = value.filter(
    (c) => !PRESETS.some((p) => p.name.toLowerCase() === c.name.toLowerCase())
  );
  const options = [...PRESETS, ...customs];

  function toggle(option: ColorOption) {
    setError("");
    if (has(option.name)) {
      onChange(
        value.filter((c) => c.name.toLowerCase() !== option.name.toLowerCase())
      );
      return;
    }
    if (value.length >= MAX_COLORS) {
      setError(`You can add up to ${MAX_COLORS} colors.`);
      return;
    }
    onChange([...value, option]);
  }

  function addCustom() {
    const clean = name.trim().replace(/\s+/g, " ");

    if (!/^[A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF -]{1,19}$/.test(clean)) {
      setError("Enter a color name with 2 to 20 letters, like Rose pink.");
      return;
    }
    if (has(clean)) {
      setError("That color is already added.");
      return;
    }
    if (value.length >= MAX_COLORS) {
      setError(`You can add up to ${MAX_COLORS} colors.`);
      return;
    }

    setError("");
    onChange([...value, { name: clean, hex: hex.toUpperCase() }]);
    setName("");
  }

  return (
    <div>
      <label className="block font-medium mb-1">
        Colors <span className="font-normal text-gray-500">(optional)</span>
      </label>
      <p className="text-sm text-gray-600 mb-2">
        Tap a color to select it. Customers choose one when they order. Leave
        all unselected if the shoe has only one color.
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = has(option.name);
          return (
            <button
              type="button"
              key={option.name}
              onClick={() => toggle(option)}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${
                on
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-gray-400"
              }`}
            >
              <span className="color-dot" style={{ background: option.hex }} />
              {option.name}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          aria-label="Pick the shade"
          className="w-14 cursor-pointer rounded-lg border bg-white p-1"
        />
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          autoComplete="off"
          maxLength={20}
          placeholder="Other color, e.g. Rose pink"
          className="border rounded-lg p-2 text-black bg-white w-56"
        />
        <button
          type="button"
          onClick={addCustom}
          className="bg-gray-800 text-white rounded-lg px-4 py-2"
        >
          Add color
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}