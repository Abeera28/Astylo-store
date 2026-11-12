"use client";

import { useState } from "react";

export type ColorOption = { name: string; hex: string };

// --- YOUR MASTER COLOR LIST ---
const ALL_COLORS: ColorOption[] = [
  // Existing
  { name: "Black", hex: "#000000" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Golden", hex: "#D4A82E" },

  // New Colors
  { name: "Purple", hex: "#6B2D8F" },
  { name: "Maroon", hex: "#800000" },
  { name: "Gray", hex: "#808080" },
  { name: "Peach", hex: "#FFCBA4" },
  { name: "Tea Pink", hex: "#F4C2C2" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Fawn Shade", hex: "#E5AA70" },
  { name: "Skin", hex: "#E6B995" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Sea Green", hex: "#2E8B57" },
  { name: "Mustard", hex: "#E1AD01" },
  { name: "Brown", hex: "#6B4226" },
  { name: "Emerald Green", hex: "#0FA968" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Beige", hex: "#E0CDA9" },
  { name: "Rose Gold", hex: "#B76E79" },
];

export default function ColorPicker({
  value,
  onChange,
}: {
  value: ColorOption[];
  onChange: (colors: ColorOption[]) => void;
}) {
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#000000");

  function toggleColor(color: ColorOption) {
    const exists = value.find((c) => c.name === color.name);
    if (exists) {
      onChange(value.filter((c) => c.name !== color.name));
    } else {
      onChange([...value, color]);
    }
  }

  function addCustomColor() {
    if (!customName.trim()) return;
    const newColor = { name: customName.trim(), hex: customHex };

    // Prevent duplicates
    if (!value.find((c) => c.name.toLowerCase() === newColor.name.toLowerCase())) {
      onChange([...value, newColor]);
    }
    setCustomName("");
  }

  return (
    <div className="space-y-3">
      <label className="block font-medium mb-1">Available Colors</label>

      {/* Grid of predefined colors */}
      <div className="flex flex-wrap gap-2">
        {ALL_COLORS.map((color) => {
          const isSelected = value.some((c) => c.name === color.name);
          return (
            <button
              key={color.name}
              type="button"
              onClick={() => toggleColor(color)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition ${
                isSelected
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-gray-400 hover:border-gray-600"
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: color.hex }}
              />
              {color.name}
            </button>
          );
        })}
      </div>

      {/* Custom Color Add Form */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
        <input
          type="text"
          placeholder="Custom color name"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          className="border rounded-lg p-2 text-black bg-white text-sm w-40"
        />
        <input
          type="color"
          value={customHex}
          onChange={(e) => setCustomHex(e.target.value)}
          className="h-10 w-12 rounded cursor-pointer border"
        />
        <button
          type="button"
          onClick={addCustomColor}
          className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm"
        >
          Add Custom
        </button>
      </div>
    </div>
  );
}