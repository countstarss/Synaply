import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTeamMembers } from "@/hooks/useTeam";
import { useCurrentTeam } from "@/hooks/useTeam";
import { RiUserLine } from "react-icons/ri";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  small?: boolean;
}

export default function MentionInput({
  value,
  onChange,
  placeholder,
  className = "",
  inputClassName = "",
  small = false,
}: MentionInputProps) {
  const tWorkflows = useTranslations("workflows");
  const resolvedPlaceholder = placeholder ?? tWorkflows("mention.placeholder");
  const [focused, setFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionList, setMentionList] = useState<boolean>(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  // 获取当前团队信息
  const { team } = useCurrentTeam();

  // 获取团队成员
  const { data: teamMembers = [], isLoading } = useTeamMembers(team?.id);

  // 检查输入中是否有@符号以及之后的文字
  useEffect(() => {
    if (focused && value) {
      const atIndex = value.lastIndexOf("@", cursorPosition);

      if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === " ")) {
        const afterAt = value.substring(atIndex + 1, cursorPosition);

        if (!afterAt.includes(" ")) {
          setMentionFilter(afterAt);
          setMentionList(true);
          return;
        }
      }
    }

    setMentionList(false);
  }, [value, cursorPosition, focused]);

  // MARK: 处理点击外部关闭提及列表
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mentionListRef.current &&
        !mentionListRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setMentionList(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  // MARK: 处理选择团队成员
  const handleSelectMember = (name: string) => {
    if (!inputRef.current) return;

    const atIndex = value.lastIndexOf("@", cursorPosition);
    if (atIndex === -1) return;

    const beforeAt = value.substring(0, atIndex);
    const afterCursor = value.substring(cursorPosition);

    // 用用户名替换@后的文本
    const newValue = `${beforeAt}@${name} ${afterCursor}`;
    onChange(newValue);

    // 关闭提及列表
    setMentionList(false);

    // 将焦点放回输入框并设置光标位置
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = atIndex + name.length + 2; // @ + 名字 + 空格
        inputRef.current.setSelectionRange(newPos, newPos);
        setCursorPosition(newPos);
      }
    }, 0);
  };

  // MARK: 过滤团队成员
  const filteredMembers = mentionFilter
    ? teamMembers.filter(
        (member) =>
          member.user.name
            ?.toLowerCase()
            .includes(mentionFilter.toLowerCase()) ||
          member.user.email.toLowerCase().includes(mentionFilter.toLowerCase())
      )
    : teamMembers;

  return (
    <div className={`relative ${className}`}>
      <div className={`${small ? "flex items-center" : ""}`}>
        {small && <RiUserLine className="w-3 h-3 opacity-70 mr-1" />}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onClick={() =>
            setCursorPosition(inputRef.current?.selectionStart || 0)
          }
          onKeyUp={(e) =>
            setCursorPosition(e.currentTarget.selectionStart || 0)
          }
          placeholder={resolvedPlaceholder}
          className={`${
            small
              ? "w-12 text-xs py-1 px-1.5 border border-transparent focus:border-app-border bg-transparent focus:bg-app-bg rounded focus:outline-none transition-colors"
              : "w-12 px-3 py-1.5 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
          } ${inputClassName}`}
        />
      </div>

      {/* 团队成员提及列表 */}
      {mentionList && (
        <div
          ref={mentionListRef}
          className={`absolute z-10 mt-1 ${
            small ? "left-0" : ""
          } w-64 max-h-48 overflow-y-auto bg-app-content-bg border border-app-border rounded-md shadow-lg`}
        >
          {isLoading ? (
            <div className="p-2 text-center text-sm text-app-text-muted">
              {tWorkflows("mention.loading")}
            </div>
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="px-3 py-1.5 hover:bg-app-button-hover cursor-pointer"
                onClick={() =>
                  handleSelectMember(
                    member.user.name || member.user.email.split("@")[0]
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                    {member.user.avatar_url ? (
                      <AvatarImage
                        src={member.user.avatar_url}
                        alt={member.user.name || member.user.email}
                      />
                    ) : null}
                    <AvatarFallback className="bg-gray-200 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                      {(member.user.name || member.user.email)[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-app-text-primary truncate">
                      {member.user.name || member.user.email.split("@")[0]}
                    </div>
                    <div className="text-xs text-app-text-muted truncate">
                      {member.user.email}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-app-text-muted">
              {mentionFilter
                ? tWorkflows("mention.noMatching")
                : tWorkflows("mention.noMembers")}
            </div>
          )}

          {/* 自定义输入选项 */}
          {mentionFilter && (
            <div
              className="px-3 py-1.5 hover:bg-app-button-hover cursor-pointer border-t border-app-border"
              onClick={() => handleSelectMember(mentionFilter)}
            >
              <div className="text-sm text-app-text-primary">
                {tWorkflows("mention.createCustom", { value: mentionFilter })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
