import { useEffect, useState } from "react";
import { getTasks, createTask, deleteTask, updateTask } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Task = {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  tags?: string;
  owner_id: number;
  // If we extend the backend task model with assignees or user models, we can display them dynamically
};

type DashboardProps = {
  newTaskOpen: boolean;
  setNewTaskOpen: (open: boolean) => void;
  refreshTrigger: number;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
};

const COLUMNS = [
  { key: "todo", label: "Backlog" },
  { key: "in-progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const PRIORITY_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
  urgent: "destructive",
};

export default function Dashboard({
  newTaskOpen,
  setNewTaskOpen,
  refreshTrigger,
  setRefreshTrigger,
}: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formError, setFormError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [tagsInput, setTagsInput] = useState("");

  function fetchTasks() {
    getTasks()
      .then(setTasks)
      .catch(() => {});
  }

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    try {
      await createTask({
        title,
        description,
        status: "todo",
        priority,
        // Since tags are stored as comma-separated strings on the database:
        ...(tagsInput ? { tags: tagsInput } : {}),
      });
      fetchTasks();
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTagsInput("");
      setNewTaskOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create task");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert("Failed to delete task");
    }
  }

  async function handleMove(id: number, currentStatus: string) {
    const statuses = ["todo", "in-progress", "done"];
    const currentIndex = statuses.indexOf(currentStatus);
    if (currentIndex === -1) return;
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    try {
      await updateTask(id, { status: nextStatus });
      fetchTasks();
    } catch {
      alert("Failed to move task");
    }
  }

  // Helper to extract initials for user avatars
  function getInitials(id: number) {
    // Standard mocking for avatars since database users aren't fully joined yet
    const names = ["Alice", "Bob", "Charlie", "David", "Emma"];
    const name = names[id % names.length];
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Create Task Dialog */}
      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" placeholder="frontend, bug" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <Button type="submit">Create Task</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-muted/40 border rounded-xl p-4 flex flex-col min-h-[500px]">
              {/* Column Title with count Badge */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {col.label}
                </h2>
                <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold bg-muted-foreground/20 text-muted-foreground rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks list */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                {colTasks.map((task) => {
                  const tags = task.tags ? task.tags.split(",").map((t) => t.trim()) : [];
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleMove(task.id, task.status)}
                      className="bg-card hover:bg-muted/20 border rounded-lg p-4 shadow-sm transition-all cursor-pointer relative group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-sm font-semibold text-card-foreground leading-tight">
                          {task.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id);
                          }}
                          className="text-muted-foreground hover:text-destructive text-xs transition-colors shrink-0"
                        >
                          ✕
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground tracking-wide"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Footer: Metadata and Assigned Circle Avatar */}
                      <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-muted/50">
                        {/* Task Priority */}
                        <Badge variant={PRIORITY_COLORS[task.priority] ?? "default"} className="text-[9px] px-1.5 py-0">
                          {task.priority}
                        </Badge>
                        
                        {/* Assignee/Owner Avatar */}
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary border flex items-center justify-center text-[10px] font-bold select-none" title={`Owner ID: ${task.owner_id}`}>
                          {getInitials(task.owner_id)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-xs text-muted-foreground italic border-2 border-dashed rounded-lg border-muted">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
