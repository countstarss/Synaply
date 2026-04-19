"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
}

const SearchBar = ({
  placeholder = "Quick Search",
  value,
  onChange,
  onSearch,
  className,
}: SearchBarProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value || "");
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Search size={16} className="text-gray-400" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        className="border-none bg-transparent h-8 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder-gray-400"
      />
    </div>
  );
};

export default SearchBar;
