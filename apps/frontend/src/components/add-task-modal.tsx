"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AddTaskModalProps {
  onCreate: (payload: {
    title: string;
    description?: string;
    dueDate?: string;
  }) => Promise<void>;
  trigger?: React.ReactNode;
  defaultDate?: Date;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  onCreate,
  trigger,
  defaultDate,
}) => {
  const tTasks = useTranslations("tasks");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(
    defaultDate ? defaultDate.toISOString().split("T")[0] : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onCreate({ title, description, dueDate });
      setTitle("");
      setDescription("");
      setDueDate("");
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent>
        <DialogHeader>
          <DialogTitle>{tTasks("addModal.title")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Input
            placeholder={tTasks("addModal.fields.titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder={tTasks("addModal.fields.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Input
            type="date"
            placeholder={tTasks("addModal.fields.dueDatePlaceholder")}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!title || loading}>
            {tTasks("addModal.actions.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
