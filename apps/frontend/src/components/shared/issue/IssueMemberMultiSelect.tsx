"use client";

import React from "react";
import { RiArrowDownSLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface IssueMemberMultiSelectOption {
  id: string;
  name: string;
  email: string;
}

interface IssueMemberMultiSelectProps {
  members: IssueMemberMultiSelectOption[];
  selectedIds: string[];
  onSelectionChange: (nextIds: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  className?: string;
  triggerClassName?: string;
}

function getSelectedLabel(
  members: IssueMemberMultiSelectOption[],
  selectedIds: string[],
  placeholder: string,
) {
  const selectedMembers = members.filter((member) => selectedIds.includes(member.id));

  if (selectedMembers.length === 0) {
    return placeholder;
  }

  const visibleNames = selectedMembers.slice(0, 2).map((member) => member.name);

  if (selectedMembers.length <= 2) {
    return visibleNames.join("、");
  }

  return `${visibleNames.join("、")} +${selectedMembers.length - 2}`;
}

export function IssueMemberMultiSelect({
  members,
  selectedIds,
  onSelectionChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  className,
  triggerClassName,
}: IssueMemberMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const label = getSelectedLabel(members, selectedIds, placeholder);
  const hasSelection = members.some((member) => selectedIds.includes(member.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-11 w-full justify-between rounded-xl border-app-border bg-app-content-bg px-3 text-left text-app-text-primary hover:bg-app-content-bg hover:text-app-text-primary",
            triggerClassName,
          )}
        >
          <span
            className={cn(
              "truncate text-sm",
              !hasSelection && "text-app-text-muted",
            )}
          >
            {label}
          </span>
          <RiArrowDownSLine className="h-4 w-4 shrink-0 text-app-text-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "w-[var(--radix-popover-trigger-width)] border-app-border bg-app-content-bg p-0",
          className,
        )}
      >
        <Command
          className="
            bg-app-content-bg text-app-text-primary
            [&_[data-slot=command-empty]]:text-app-text-muted
            [&_[data-slot=command-input-wrapper]]:border-app-border
            [&_[data-slot=command-input-wrapper]]:bg-app-content-bg
            [&_[data-slot=command-input]]:text-app-text-primary
            [&_[data-slot=command-input]]:placeholder:text-app-text-muted
          "
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-60">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {members.map((member) => {
                const isChecked = selectedIds.includes(member.id);

                return (
                  <CommandItem
                    key={member.id}
                    value={`${member.name} ${member.email} ${member.id}`}
                    onSelect={() => {
                      const nextIds = isChecked
                        ? selectedIds.filter((id) => id !== member.id)
                        : [...selectedIds, member.id];

                      onSelectionChange(nextIds);
                    }}
                    className="gap-3 rounded-lg px-3 py-2 data-[selected=true]:bg-app-button-hover data-[selected=true]:text-app-text-primary"
                  >
                    <Checkbox
                      checked={isChecked}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="pointer-events-none border-app-border"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-app-text-primary">
                        {member.name}
                      </div>
                      <div className="truncate text-xs text-app-text-muted">
                        {member.email}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
