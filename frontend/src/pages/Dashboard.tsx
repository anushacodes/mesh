import { useEffect, useState } from "react";
import { getBoards, createBoard, deleteBoard, createTeam, addTeamMember } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Team = {
  id: number;
  name: string;
};

type Board = {
  id: number;
  name: string;
  description?: string;
  team_id?: number;
};

type DashboardProps = {
  teams: Team[];
  scope: "personal" | "work";
  refreshTeams: () => void;
  onSelectBoard: (board: Board) => void;
};

export default function Dashboard({ teams, scope, refreshTeams, onSelectBoard }: DashboardProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  
  // Dialog visibility states
  const [boardOpen, setBoardOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  // Create Board form state
  const [boardName, setBoardName] = useState("");
  const [boardDesc, setBoardDesc] = useState("");
  const [targetTeamId, setTargetTeamId] = useState<string>("");
  const [boardError, setBoardError] = useState("");

  // Create Team form states
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [createdTeamId, setCreatedTeamId] = useState<number | null>(null);
  const [teamError, setTeamError] = useState("");

  // Invite member states (Step 2 of Team Creation)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  useEffect(() => {
    fetchBoards();
  }, []);

  // Pre-select first team as default when board creation dialog opens
  useEffect(() => {
    if (teams.length > 0 && !targetTeamId) {
      setTargetTeamId(teams[0].id.toString());
    }
  }, [teams, boardOpen]);

  async function fetchBoards() {
    try {
      const data = await getBoards();
      setBoards(data);

      // Auto-create a default board if they have 0 boards
      if (data.length === 0) {
        const defaultBoard = await createBoard({
          name: "Personal Board",
          description: "Your default personal space workspace.",
        });
        setBoards([defaultBoard]);
      }
    } catch {}
  }

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    setBoardError("");
    try {
      const payload = {
        name: boardName,
        description: boardDesc,
        team_id: scope === "work" && targetTeamId ? parseInt(targetTeamId) : undefined,
      };
      const newBoard = await createBoard(payload);
      setBoards((prev) => [...prev, newBoard]);
      setBoardName("");
      setBoardDesc("");
      setBoardOpen(false);
    } catch (err: unknown) {
      setBoardError(err instanceof Error ? err.message : "Failed to create board");
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setTeamError("");
    try {
      const newTeam = await createTeam({ name: teamName, description: teamDesc });
      setCreatedTeamId(newTeam.id);
      setTeamName("");
      setTeamDesc("");
      refreshTeams(); // Update App.tsx teams state
    } catch (err: unknown) {
      setTeamError(err instanceof Error ? err.message : "Failed to create team");
    }
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!createdTeamId) return;
    setInviteError("");
    setInviteSuccess("");
    try {
      await addTeamMember(createdTeamId, inviteEmail);
      setInviteSuccess(`Successfully invited ${inviteEmail}!`);
      setInviteEmail("");
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  async function handleDeleteBoard(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this board?")) return;
    try {
      await deleteBoard(id);
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert("Failed to delete board");
    }
  }

  const personalBoards = boards.filter((b) => b.team_id === null || b.team_id === undefined);
  const teamBoards = boards.filter((b) => b.team_id !== null && b.team_id !== undefined);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header and Control Buttons */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold capitalize">
          {scope === "personal" ? "Personal Space" : "Work Space"}
        </h1>

        <div className="flex gap-3">
          {/* Work Space: Create Team Button */}
          {scope === "work" && (
            <Dialog open={teamOpen} onOpenChange={(open) => {
              setTeamOpen(open);
              if (!open) {
                // Reset states when closing
                setCreatedTeamId(null);
                setInviteEmail("");
                setInviteError("");
                setInviteSuccess("");
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline">+ Create Team</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {createdTeamId ? "Invite Members" : "Create New Team"}
                  </DialogTitle>
                </DialogHeader>

                {!createdTeamId ? (
                  /* Step 1: Create Team */
                  <form onSubmit={handleCreateTeam} className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Design Team"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="teamDesc">Description</Label>
                      <Input
                        id="teamDesc"
                        value={teamDesc}
                        onChange={(e) => setTeamDesc(e.target.value)}
                        placeholder="Project workspace descriptions"
                      />
                    </div>
                    {teamError && <p className="text-sm text-red-500">{teamError}</p>}
                    <Button type="submit">Create Team</Button>
                  </form>
                ) : (
                  /* Step 2: Invite Members */
                  <div className="flex flex-col gap-4 mt-2">
                    <p className="text-xs text-muted-foreground">
                      Your team has been created successfully! Invite your teammates now.
                    </p>
                    <form onSubmit={handleInviteMember} className="flex flex-col gap-3">
                      <Label htmlFor="inviteEmail">Member Email</Label>
                      <div className="flex gap-2">
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="coworker@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                        />
                        <Button type="submit">Invite</Button>
                      </div>
                    </form>
                    {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
                    {inviteSuccess && <p className="text-xs text-green-500 font-semibold">{inviteSuccess}</p>}
                    
                    <Button 
                      variant="secondary" 
                      onClick={() => setTeamOpen(false)}
                      className="mt-2"
                    >
                      Finish
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}

          {/* Create Board Button */}
          <Dialog open={boardOpen} onOpenChange={setBoardOpen}>
            <DialogTrigger asChild>
              <Button>+ Create Board</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Board</DialogTitle>
              </DialogHeader>

              {scope === "work" && teams.length === 0 ? (
                /* Work scope warning: no teams exist */
                <div className="flex flex-col items-center text-center gap-4 py-2">
                  <p className="text-xs text-muted-foreground">
                    You must belong to at least one team before you can create a team board.
                  </p>
                  <Button onClick={() => {
                    setBoardOpen(false);
                    setTeamOpen(true);
                  }}>
                    Create a Team First
                  </Button>
                </div>
              ) : (
                /* Normal Board Creation Form */
                <form onSubmit={handleCreateBoard} className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="boardName">Board Name</Label>
                    <Input
                      id="boardName"
                      value={boardName}
                      onChange={(e) => setBoardName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="boardDesc">Description</Label>
                    <Input
                      id="boardDesc"
                      value={boardDesc}
                      onChange={(e) => setBoardDesc(e.target.value)}
                    />
                  </div>

                  {scope === "work" && (
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="teamSelect">Assign to Team</Label>
                      <select
                        id="teamSelect"
                        value={targetTeamId}
                        onChange={(e) => setTargetTeamId(e.target.value)}
                        required
                        className="border rounded-md px-3 py-2 text-sm bg-background"
                      >
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {boardError && <p className="text-sm text-red-500">{boardError}</p>}
                  <Button type="submit">Create Board</Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Boards Grids */}
      <div className="flex flex-col gap-8">
        {/* Personal Boards (only visible on "personal" tab) */}
        {scope === "personal" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {personalBoards.map((board) => (
                <Card
                  key={board.id}
                  onClick={() => onSelectBoard(board)}
                  className="cursor-pointer hover:border-foreground/40 transition-all shadow-sm"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-semibold">{board.name}</CardTitle>
                    <button
                      onClick={(e) => handleDeleteBoard(board.id, e)}
                      className="text-muted-foreground hover:text-destructive text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {board.description || "No description."}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Team Boards (only visible on "work" tab) */}
        {scope === "work" && (
          <div>
            {teamBoards.length === 0 ? (
              <p className="text-sm text-muted-foreground">You don't have any team boards yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {teamBoards.map((board) => {
                  const teamName = teams.find((t) => t.id === board.team_id)?.name || "Unknown Team";
                  return (
                    <Card
                      key={board.id}
                      onClick={() => onSelectBoard(board)}
                      className="cursor-pointer hover:border-foreground/40 transition-all shadow-sm"
                    >
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex flex-col">
                          <CardTitle className="text-base font-semibold">{board.name}</CardTitle>
                          <span className="text-[9px] text-muted-foreground font-mono bg-muted w-max px-1 rounded mt-0.5">
                            {teamName}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteBoard(board.id, e)}
                          className="text-muted-foreground hover:text-destructive text-xs transition-colors"
                        >
                          ✕
                        </button>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {board.description || "No description."}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
