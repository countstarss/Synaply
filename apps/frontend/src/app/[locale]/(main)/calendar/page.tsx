"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { useTasks } from "@/hooks/useTasks";
import { TaskCalendar } from "@/components/task-calendar";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";

const CalendarPage = () => {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || null;
  const { tasks, createTask } = useTasks(workspaceId);

  const { isOpen } = useSidebarStore();
  if (!workspaceId) return null;

  return (
    <div
      className={cn(
        "flex flex-col h-full ",
        isOpen ? " w-[calc(100vw-282px)]" : " w-[calc(100vw-16px)]"
      )}
    >
      <TaskCalendar
        workspaceId={workspaceId}
        tasks={tasks}
        onCreateTask={async (p) => {
          await createTask(p);
        }}
      />
    </div>
  );
};

export default CalendarPage;
