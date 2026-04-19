"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RiAtLine, RiLoader4Line, RiSendPlaneLine } from "react-icons/ri";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useComments, useCreateComment } from "@/hooks/useComment";

export interface DiscussionMember {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface DiscussionTabProps {
  issueId: string;
  workspaceId: string;
  members: DiscussionMember[];
}

export const DiscussionTab: React.FC<DiscussionTabProps> = ({
  issueId,
  workspaceId,
  members,
}) => {
  const tIssues = useTranslations("issues");
  const locale = useLocale();
  const { session } = useAuth();
  const { data: comments = [], isLoading } = useComments(issueId);
  const { mutate: submitComment, isPending: isSubmitting } = useCreateComment();

  const [commentText, setCommentText] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const latestCommentAnchorRef = useRef<HTMLDivElement>(null);
  const lastCommentIdRef = useRef<string | null>(null);

  const scrollToLatestComment = (behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      latestCommentAnchorRef.current?.scrollIntoView({
        behavior,
        block: "end",
      });
    });
  };

  useEffect(() => {
    if (isLoading || comments.length === 0) {
      return;
    }

    const latestCommentId = comments[comments.length - 1]?.id;
    if (!latestCommentId) {
      return;
    }

    const behavior = lastCommentIdRef.current ? "smooth" : "auto";
    if (lastCommentIdRef.current !== latestCommentId) {
      scrollToLatestComment(behavior);
      lastCommentIdRef.current = latestCommentId;
    }
  }, [comments, isLoading]);

  const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    const cursorPos = event.target.selectionStart;

    setCommentText(value);
    setCursorPosition(cursorPos);

    const atIndex = value.lastIndexOf("@", cursorPos);
    if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === " ")) {
      const query = value.substring(atIndex + 1, cursorPos);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentionList(true);
        return;
      }
    }
    setShowMentionList(false);
  };

  const handleMentionSelect = (member: DiscussionMember) => {
    const atIndex = commentText.lastIndexOf("@", cursorPosition);
    const beforeAt = commentText.substring(0, atIndex);
    const afterCursor = commentText.substring(cursorPosition);
    const memberName = member.name || member.email?.split("@")[0] || "";
    const newText = `${beforeAt}@${memberName} ${afterCursor}`;

    setCommentText(newText);
    setShowMentionList(false);
    setMentionQuery("");

    setTimeout(() => {
      if (commentInputRef.current) {
        const newCursorPos = atIndex + memberName.length + 2;
        commentInputRef.current.focus();
        commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;

    submitComment({
      content: commentText,
      issueId,
      workspaceId,
    });

    setCommentText("");
    setShowMentionList(false);
  };

  const filteredMembers = members.filter((member) =>
    `${member.name} ${member.email || ""}`
      .toLowerCase()
      .includes(mentionQuery.toLowerCase()),
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RiLoader4Line className="h-6 w-6 animate-spin text-sky-600" />
            </div>
          ) : comments.length === 0 ? (
            <div className="py-8 text-center text-app-text-muted">
              {tIssues("tabs.discussion.empty")}
            </div>
          ) : (
            <div className="mb-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.avatarUrl || ""} />
                    <AvatarFallback>
                      {comment.author.name?.[0] || comment.author.email?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-app-text-primary">
                        {comment.author.name || comment.author.email?.split("@")[0]}
                      </span>
                      <span className="text-xs text-app-text-muted">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm text-app-text-secondary">
                      {comment.content.split(/(@\w+)/).map((part, index) => (
                        <span
                          key={index}
                          className={part.startsWith("@") ? "font-medium text-sky-600" : ""}
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={latestCommentAnchorRef} aria-hidden="true" />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="relative shrink-0 border-t border-app-border p-4">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.user_metadata?.avatar_url || ""} />
            <AvatarFallback>{session?.user?.email?.[0] || "?"}</AvatarFallback>
          </Avatar>

          <div className="relative flex-1">
            <Textarea
              ref={commentInputRef}
              value={commentText}
              onChange={handleCommentChange}
              placeholder={tIssues("tabs.discussion.placeholder")}
              className="min-h-24 resize-none border-app-border bg-app-bg text-app-text-primary placeholder:text-app-text-muted"
              rows={2}
              disabled={isSubmitting}
            />

            {showMentionList && (
              <div className="absolute inset-x-0 bottom-full z-50 mb-2 max-h-60 overflow-y-auto rounded-md border border-app-border bg-app-content-bg shadow-lg">
                {filteredMembers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-app-text-muted">
                    {tIssues("tabs.discussion.noMembers")}
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <Button
                      key={member.id}
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-start rounded-none px-3 py-2 text-left hover:bg-app-button-hover"
                      onClick={() => handleMentionSelect(member)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatarUrl || ""} />
                        <AvatarFallback>
                          {member.name?.[0] || member.email?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-app-text-primary">
                          {member.name || member.email?.split("@")[0]}
                        </div>
                        <div className="text-xs text-app-text-muted">
                          {member.email}
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            )}

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-app-text-muted">
                <RiAtLine className="h-3 w-3" />
                <span>{tIssues("tabs.discussion.mentionHint")}</span>
              </div>
              <Button
                type="button"
                className="bg-sky-600 text-white hover:bg-sky-500"
                disabled={!commentText.trim() || isSubmitting}
                onClick={handleSendComment}
              >
                {isSubmitting ? (
                  <RiLoader4Line className="h-3 w-3 animate-spin" />
                ) : (
                  <RiSendPlaneLine className="h-3 w-3" />
                )}
                {tIssues("tabs.discussion.send")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionTab;
