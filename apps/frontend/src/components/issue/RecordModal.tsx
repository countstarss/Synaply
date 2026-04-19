"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { resultText: string }) => void;
}

export function RecordModal({ isOpen, onClose, onSubmit }: RecordModalProps) {
  const tIssues = useTranslations("issues");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setText("");
    }
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-lg border-app-border bg-app-content-bg p-6"
        showCloseButton={false}
      >
        <DialogTitle className="text-lg text-app-text-primary">
          {tIssues("recordModal.title")}
        </DialogTitle>
        <div className="space-y-4">
          <Textarea
            className="min-h-32 border-app-border bg-app-bg text-app-text-primary"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={tIssues("recordModal.placeholder")}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-app-border bg-transparent text-app-text-primary"
              onClick={onClose}
            >
              {tIssues("recordModal.cancel")}
            </Button>
            <Button
              type="button"
              className="bg-sky-600 text-white hover:bg-sky-500"
              disabled={!text.trim()}
              onClick={() => onSubmit({ resultText: text.trim() })}
            >
              {tIssues("recordModal.submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RecordModal;
