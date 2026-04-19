import React from "react";
import { useTranslations } from "next-intl";
import { RiCheckLine } from "react-icons/ri";

interface SimpleColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

const predefinedColors = [
  {
    value: "blue",
    bg: "bg-blue-500",
    border: "border-blue-500",
    classes:
      "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
  },
  {
    value: "purple",
    bg: "bg-purple-500",
    border: "border-purple-500",
    classes:
      "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
  },
  {
    value: "green",
    bg: "bg-green-500",
    border: "border-green-500",
    classes:
      "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  },
  {
    value: "orange",
    bg: "bg-orange-500",
    border: "border-orange-500",
    classes:
      "border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
  },
  {
    value: "red",
    bg: "bg-red-500",
    border: "border-red-500",
    classes:
      "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
  },
  {
    value: "gray",
    bg: "bg-gray-500",
    border: "border-gray-500",
    classes:
      "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400",
  },
  {
    value: "cyan",
    bg: "bg-cyan-500",
    border: "border-cyan-500",
    classes:
      "border-cyan-300 dark:border-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400",
  },
  {
    value: "pink",
    bg: "bg-pink-500",
    border: "border-pink-500",
    classes:
      "border-pink-300 dark:border-pink-600 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400",
  },
  {
    value: "yellow",
    bg: "bg-yellow-500",
    border: "border-yellow-500",
    classes:
      "border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
  },
];

export default function SimpleColorPicker({
  value,
  onChange,
  className,
}: SimpleColorPickerProps) {
  const tWorkflows = useTranslations("workflows");
  const selectedColor =
    predefinedColors.find((color) => color.value === value) ||
    predefinedColors[0];
  const selectedColorName = tWorkflows(`colors.${selectedColor.value}`);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-5 gap-2">
        {predefinedColors.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className={`
              w-10 h-10 rounded-lg border-2 ${color.bg} 
              ${
                selectedColor.value === color.value
                  ? "ring-2 ring-offset-2 ring-blue-500"
                  : "hover:opacity-80"
              }
              transition-all duration-200 flex items-center justify-center
            `}
            title={tWorkflows(`colors.${color.value}`)}
          >
            {selectedColor.value === color.value && (
              <RiCheckLine className="w-4 h-4 text-white" />
            )}
          </button>
        ))}
      </div>

      <div className="text-sm text-app-text-secondary">
        {tWorkflows("colors.selected", { value: selectedColorName })}
      </div>
    </div>
  );
}

// 导出颜色映射函数
export function getColorClasses(colorValue: string): string {
  const color = predefinedColors.find((c) => c.value === colorValue);
  return color ? color.classes : predefinedColors[0].classes;
}
