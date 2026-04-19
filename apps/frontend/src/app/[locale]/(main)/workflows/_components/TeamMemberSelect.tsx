"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { RiSearchLine, RiUser3Line, RiUser2Line } from "react-icons/ri";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface TeamMemberSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TeamMemberSelect({
  value,
  onChange,
  placeholder,
  className = "",
}: TeamMemberSelectProps) {
  const tWorkflows = useTranslations("workflows");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const member = teamMembers.find(
        (member) => member.name === value || member.id === value
      );
      if (member) {
        setSelectedMember(member);
      } else {
        setSelectedMember({ id: "temp", name: value });
      }
    } else {
      setSelectedMember(null);
    }
  }, [value, teamMembers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery("");
    }
  };

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member);
    onChange(member.name);
    setIsOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.role &&
        member.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={handleToggleDropdown}
        className="flex items-center justify-between w-full px-2 py-1.5 border border-app-border rounded-md bg-app-bg text-app-text-primary cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selectedMember ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5 bg-gray-200 dark:bg-gray-700">
              {selectedMember.avatar ? (
                <AvatarImage
                  src={selectedMember.avatar}
                  alt={selectedMember.name}
                />
              ) : null}
              <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                <RiUser3Line className="w-3 h-3 text-gray-600 dark:text-gray-300" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{selectedMember.name}</span>
          </div>
        ) : (
          <span className="text-sm text-app-text-muted">
            {placeholder || tWorkflows("teamMemberSelect.placeholder")}
          </span>
        )}
        <div className="ml-2">
          <svg
            className={`w-4 h-4 text-app-text-secondary transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-app-content-bg border border-app-border rounded-md shadow-lg">
          <div className="sticky top-0 bg-app-content-bg p-2 border-b border-app-border">
            <div className="relative">
              <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
              <input
                type="text"
                placeholder={tWorkflows("teamMemberSelect.searchPlaceholder")}
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-8 pr-3 py-1.5 bg-app-bg border border-app-border rounded-md text-sm text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="px-3 py-2 hover:bg-app-button-hover cursor-pointer flex items-center gap-2"
                  onClick={() => handleSelectMember(member)}
                >
                  <Avatar className="h-6 w-6 bg-gray-200 dark:bg-gray-700">
                    {member.avatar ? (
                      <AvatarImage src={member.avatar} alt={member.name} />
                    ) : null}
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                      <RiUser3Line className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-app-text-primary">
                      {member.name}
                    </div>
                    {member.role && (
                      <div className="text-xs text-app-text-secondary">
                        {member.role}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-app-text-muted text-center">
                {tWorkflows("teamMemberSelect.noMatching")}
              </div>
            )}

            {searchQuery &&
              !filteredMembers.some((m) => m.name === searchQuery) && (
                <div
                  className="px-3 py-2 hover:bg-app-button-hover cursor-pointer flex items-center gap-2 border-t border-app-border"
                  onClick={() => {
                    const customMember = {
                      id: `custom-${Date.now()}`,
                      name: searchQuery,
                    };
                    handleSelectMember(customMember);
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <RiUser2Line className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-app-text-primary">
                      {tWorkflows("teamMemberSelect.customLabel", {
                        value: searchQuery,
                      })}
                    </div>
                    <div className="text-xs text-app-text-secondary">
                      {tWorkflows("teamMemberSelect.customHint")}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
