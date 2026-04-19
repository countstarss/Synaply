"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RiSendPlane2Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AiComposerProps {
  disabled?: boolean;
  onSend: (text: string) => Promise<void>;
}

export function AiComposer({ disabled = false, onSend }: AiComposerProps) {
  const tAi = useTranslations("ai");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedText = text.trim();

    if (!trimmedText || disabled || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSend(trimmedText);
      setText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-app-border bg-app-content-bg p-4">
      <div className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          disabled={disabled || isSubmitting}
          placeholder={tAi("thread.composer.placeholder")}
          className="border-app-border bg-app-bg text-app-text-primary"
        />
        <Button
          type="button"
          disabled={disabled || isSubmitting || !text.trim()}
          className="bg-sky-600 text-white hover:bg-sky-500"
          onClick={() => void handleSubmit()}
        >
          <RiSendPlane2Line className="h-4 w-4" />
          {tAi("thread.composer.send")}
        </Button>
      </div>
    </div>
  );
}
