"use client";

import { use, useState } from "react";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { addTravelTask, deleteTravelTask, toggleTravelTask } from "@/lib/store";
import type { TaskPriority, TravelTask } from "@/lib/types";
import { cn, formatShortDate, todayISO } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/shared";
import { TripShell } from "@/components/trip-shell";

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 };

function TaskRow({ task }: { task: TravelTask }) {
  const overdue = !task.isDone && task.dueDate !== null && task.dueDate < todayISO();
  return (
    <Card className="flex items-center gap-3 p-4">
      <Checkbox
        checked={task.isDone}
        onToggle={() => toggleTravelTask(task.id)}
        label={`Mark ${task.title} as done`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            task.isDone ? "text-charcoal-400 line-through" : "text-charcoal-900"
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-charcoal-400">
          {task.category !== "general" && <span className="capitalize">{task.category}</span>}
          {task.dueDate && (
            <span className={cn(overdue && "font-semibold text-red-600")}>
              due {formatShortDate(task.dueDate)}
              {overdue && " — overdue"}
            </span>
          )}
        </div>
      </div>
      {task.priority === "high" && <Badge variant="red">High</Badge>}
      {task.priority === "low" && <Badge variant="outline">Low</Badge>}
      <Button
        variant="danger"
        size="sm"
        aria-label={`Delete ${task.title}`}
        onClick={() => deleteTravelTask(task.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </Card>
  );
}

export default function TasksPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState("");

  function addTask() {
    if (!title.trim()) return;
    addTravelTask({
      tripId,
      title: title.trim(),
      category: "general",
      priority,
      dueDate: dueDate || null,
      isDone: false,
      notes: "",
    });
    setTitle("");
    setDueDate("");
    setPriority("normal");
  }

  return (
    <TripShell tripId={tripId} active="/tasks">
      {(bundle) => {
        const tasks = [...bundle.travelTasks].sort((a, b) => {
          if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
          if (a.dueDate !== b.dueDate) {
            return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
          }
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        });
        const open = tasks.filter((t) => !t.isDone).length;

        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Travel Tasks{" "}
                <span className="text-sm font-normal text-charcoal-400">({open} open)</span>
              </h2>
            </div>

            <Card className="p-4">
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addTask();
                }}
              >
                <Input
                  className="min-w-44 flex-1"
                  placeholder="Add a task…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Select
                  className="w-28"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  aria-label="Priority"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </Select>
                <Input
                  type="date"
                  className="w-40"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  aria-label="Due date"
                />
                <Button type="submit" disabled={!title.trim()}>
                  <Plus className="size-4" /> Add
                </Button>
              </form>
            </Card>

            {tasks.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No tasks yet"
                description="Add booking, confirmation, and prep tasks so nothing slips."
              />
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        );
      }}
    </TripShell>
  );
}
