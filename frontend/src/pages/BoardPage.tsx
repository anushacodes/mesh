import { useEffect, useState } from "react";
import { getTasks, createTask, deleteTask, updateTask, getTeamMembers, updateBoard } from "@/lib/api";
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
  assignee_id?: number | null;
  due_at?: string | null;
};

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Board = {
  id: number;
  name: string;
  description?: string;
  team_id?: number;
};

type TeamMember = {
  user_id: number;
  name: string;
  email: string;
  role: string;
};

type BoardPageProps = {
  board: Board;
  user: UserProfile | null;
  onBack: () => void;
  newTaskOpen: boolean;
  setNewTaskOpen: (open: boolean) => void;
};

// 4 Columns: Backlog, To Do, In Progress, Done
const COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const PRIORITY_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
  urgent: "destructive",
};

export default function BoardPage({ board, user, onBack, newTaskOpen, setNewTaskOpen }: BoardPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Local Board Identity States
  const [localBoardName, setLocalBoardName] = useState(board.name);
  const [localBoardDesc, setLocalBoardDesc] = useState(board.description || "");

  // Create Task states
  const [formError, setFormError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [tagsInput, setTagsInput] = useState("");
  const [assigneeId, setAssigneeId] = useState("unassigned");
  const [dueAt, setDueAt] = useState("");

  // Edit Task states
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState<string>("unassigned");
  const [editDueAt, setEditDueAt] = useState("");
  const [editError, setEditError] = useState("");

  // Edit Board states
  const [editBoardOpen, setEditBoardOpen] = useState(false);
  const [boardFormName, setBoardFormName] = useState(board.name);
  const [boardFormDesc, setBoardFormDesc] = useState(board.description || "");
  const [boardFormError, setBoardFormError] = useState("");

  // Sync board name/description when board prop changes
  useEffect(() => {
    setLocalBoardName(board.name);
    setLocalBoardDesc(board.description || "");
  }, [board]);

  // Fetch tasks
  useEffect(() => {
    getTasks(board.id)
      .then(setTasks)
      .catch(() => {});
  }, [refreshTrigger, board.id]);

  // Fetch team members if it's a team board
  useEffect(() => {
    if (board.team_id) {
      getTeamMembers(board.team_id)
        .then(setTeamMembers)
        .catch(() => {});
    } else {
      setTeamMembers([]);
    }
  }, [board.team_id]);

  // Setup edit form fields when a task is clicked
  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditTags(task.tags || "");
    setEditAssigneeId(task.assignee_id ? task.assignee_id.toString() : "unassigned");
    // Format UTC string into datetime-local format: YYYY-MM-DDTHH:MM
    setEditDueAt(task.due_at ? task.due_at.substring(0, 16) : "");
    setEditError("");
  };

  const handleOpenEditBoard = () => {
    setBoardFormName(localBoardName);
    setBoardFormDesc(localBoardDesc);
    setBoardFormError("");
    setEditBoardOpen(true);
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    try {
      await createTask({
        title,
        board_id: board.id,
        description,
        status: "backlog", // New tasks default to Backlog
        priority,
        ...(tagsInput ? { tags: tagsInput } : {}),
        assignee_id: assigneeId === "unassigned" ? null : parseInt(assigneeId),
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTagsInput("");
      setAssigneeId("unassigned");
      setDueAt("");
      setNewTaskOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create task");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTask) return;
    setEditError("");
    try {
      const payload = {
        title: editTitle,
        description: editDesc,
        status: editStatus,
        priority: editPriority,
        tags: editTags || null,
        assignee_id: editAssigneeId === "unassigned" ? null : parseInt(editAssigneeId),
        due_at: editDueAt ? new Date(editDueAt).toISOString() : null,
      };
      await updateTask(editingTask.id, payload);
      setEditingTask(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update task");
    }
  }

  async function handleEditBoardSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBoardFormError("");
    try {
      await updateBoard(board.id, {
        name: boardFormName,
        description: boardFormDesc,
      });
      setLocalBoardName(boardFormName);
      setLocalBoardDesc(boardFormDesc);
      setEditBoardOpen(false);
    } catch (err: unknown) {
      setBoardFormError(err instanceof Error ? err.message : "Failed to update board");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setEditingTask(null);
    } catch {
      alert("Failed to delete task");
    }
  }

  // Get initials for assignee bubbles
  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  const isTeamBoard = board.team_id !== null && board.team_id !== undefined;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header and Back navigation */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col gap-1">
          <button
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground font-medium mb-1 flex items-center gap-1 transition-colors outline-none"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{localBoardName}</h1>
            <button
              onClick={handleOpenEditBoard}
              className="text-muted-foreground hover:text-foreground text-[10px] bg-muted/50 hover:bg-muted px-1.5 py-0.5 rounded transition-all outline-none"
              title="Edit Board Title"
            >
              Edit
            </button>
          </div>
          {localBoardDesc && (
            <p className="text-xs text-muted-foreground">{localBoardDesc}</p>
          )}
        </div>
        
        {/* New Task Button */}
        <Button onClick={() => setNewTaskOpen(true)}>+ New Task</Button>
      </div>

      {/* Edit Board Identity Dialog */}
      <Dialog open={editBoardOpen} onOpenChange={setEditBoardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Board Settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditBoardSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="boardFormName">Board Name</Label>
              <Input
                id="boardFormName"
                value={boardFormName}
                onChange={(e) => setBoardFormName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="boardFormDesc">Description</Label>
              <Input
                id="boardFormDesc"
                value={boardFormDesc}
                onChange={(e) => setBoardFormDesc(e.target.value)}
              />
            </div>
            {boardFormError && <p className="text-sm text-red-500">{boardFormError}</p>}
            <Button type="submit">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

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
            
            <div className="grid grid-cols-2 gap-4">
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

              {/* Time Limit Input */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="dueAt">Time Limit</Label>
                <Input
                  id="dueAt"
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="h-[38px] text-xs"
                />
              </div>
            </div>

            {/* Assignee selection inside Create Dialog (only on team boards) */}
            {isTeamBoard && (
              <div className="flex flex-col gap-1">
                <Label htmlFor="assignee">Assignee</Label>
                <select
                  id="assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="unassigned">-- Unassigned --</option>
                  {teamMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <Button type="submit">Create Task</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editingTask !== null} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <form onSubmit={handleUpdate} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="editTitle">Title</Label>
                <Input id="editTitle" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="editDesc">Description</Label>
                <Input id="editDesc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="editTags">Tags (comma-separated)</Label>
                <Input id="editTags" placeholder="frontend, bug" value={editTags} onChange={(e) => setEditTags(e.target.value)} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="editStatus">Status</Label>
                  <select
                    id="editStatus"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <Label htmlFor="editPriority">Priority</Label>
                  <select
                    id="editPriority"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Time Limit Edit Input */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="editDueAt">Time Limit</Label>
                <Input
                  id="editDueAt"
                  type="datetime-local"
                  value={editDueAt}
                  onChange={(e) => setEditDueAt(e.target.value)}
                  className="h-[38px] text-xs"
                />
              </div>

              {/* Assignee selection: only visible on Team Boards */}
              {isTeamBoard && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="editAssignee">Assignee</Label>
                  <select
                    id="editAssignee"
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="unassigned">-- Unassigned --</option>
                    {teamMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editError && <p className="text-sm text-red-500">{editError}</p>}
              
              <div className="flex items-center justify-between gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => handleDelete(editingTask.id)}
                  className="text-xs text-destructive hover:underline font-semibold"
                >
                  Delete Task
                </button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Kanban columns (now 4 columns grid) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-muted/40 border rounded-xl p-3 flex flex-col min-h-[500px]">
              {/* Column Title */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
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
                  
                  // Look up assignee name for initials circle
                  let assigneeName = "";
                  if (task.assignee_id) {
                    const matchedMember = teamMembers.find((m) => m.user_id === task.assignee_id);
                    if (matchedMember) {
                      assigneeName = matchedMember.name;
                    }
                  }

                  // Evaluate if time limit has expired (and show notification badge)
                  const isOverdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== "done";

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleOpenEdit(task)}
                      className="bg-card hover:border-foreground/30 border rounded-lg p-4 shadow-sm transition-all cursor-pointer relative group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-sm font-semibold text-card-foreground leading-tight">
                          {task.title}
                        </h3>
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

                      {/* Expiration Time Limit Indicators */}
                      {task.due_at && (
                        <div className="mt-3 flex items-center">
                          {isOverdue ? (
                            <span className="text-[9px] font-semibold text-red-500 bg-red-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                              ⚠️ Time Limit Expired (Demoted)
                            </span>
                          ) : (
                            <span className="text-[9px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded">
                              📅 Limit: {new Date(task.due_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-muted/50">
                        {/* Task Priority */}
                        <Badge variant={PRIORITY_COLORS[task.priority] ?? "default"} className="text-[9px] px-1.5 py-0">
                          {task.priority}
                        </Badge>
                        
                        {/* Assignee Avatar */}
                        {isTeamBoard && (
                          task.assignee_id && assigneeName ? (
                            <div 
                              className="h-6 w-6 rounded-full bg-primary/10 text-primary border flex items-center justify-center text-[10px] font-bold select-none" 
                              title={`Assigned to: ${assigneeName}`}
                            >
                              {getInitials(assigneeName)}
                            </div>
                          ) : (
                            <div 
                              className="h-6 w-6 rounded-full bg-muted border border-dashed border-muted-foreground/30 text-muted-foreground/50 flex items-center justify-center text-xs font-bold select-none" 
                              title="Unassigned"
                            >
                              +
                            </div>
                          )
                        )}
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
