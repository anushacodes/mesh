import { useEffect, useState } from "react";
import { getBoards, createBoard, deleteBoard, createTeam, addTeamMember, getTeamMembers, updateTeam } from "@/lib/api";
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
  description?: string;
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

type DashboardProps = {
  teams: Team[];
  scope: "personal" | "work";
  refreshTeams: () => void;
  onSelectBoard: (board: Board) => void;
};

export default function Dashboard({ teams, scope, refreshTeams, onSelectBoard }: DashboardProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [teamMembersMap, setTeamMembersMap] = useState<Record<number, TeamMember[]>>({});
  
  // Dialog visibility states
  const [boardOpen, setBoardOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [quickInviteOpen, setQuickInviteOpen] = useState(false);
  const [editTeamOpen, setEditTeamOpen] = useState(false);

  // Scoped states
  const [selectedTeamForBoard, setSelectedTeamForBoard] = useState<Team | null>(null);
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<Team | null>(null);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<Team | null>(null);

  // Create Board form states
  const [boardName, setBoardName] = useState("");
  const [boardDesc, setBoardDesc] = useState("");
  const [boardError, setBoardError] = useState("");

  // Create Team form states
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [teamError, setTeamError] = useState("");

  // Edit Team form states
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDesc, setEditTeamDesc] = useState("");
  const [editTeamError, setEditTeamError] = useState("");

  // Invite states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  useEffect(() => {
    fetchBoards();
  }, []);

  // Fetch team members for all teams when teams array changes
  useEffect(() => {
    if (scope === "work" && teams.length > 0) {
      teams.forEach((team) => {
        getTeamMembers(team.id)
          .then((members) => {
            setTeamMembersMap((prev) => ({ ...prev, [team.id]: members }));
          })
          .catch(() => {});
      });
    }
  }, [teams, scope]);

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
    const targetTeamId = scope === "work" ? selectedTeamForBoard?.id : undefined;
    try {
      const payload = {
        name: boardName,
        description: boardDesc,
        team_id: targetTeamId,
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
      setTeamName("");
      setTeamDesc("");
      setTeamOpen(false);
      refreshTeams(); // Update App.tsx teams state
      
      // Auto-open quick invite for the newly created team
      setSelectedTeamForInvite(newTeam);
      setQuickInviteOpen(true);
    } catch (err: unknown) {
      setTeamError(err instanceof Error ? err.message : "Failed to create team");
    }
  }

  // Pre-fill Edit Team fields
  const handleOpenEditTeam = (team: Team) => {
    setSelectedTeamForEdit(team);
    setEditTeamName(team.name);
    setEditTeamDesc(team.description || "");
    setEditTeamError("");
    setEditTeamOpen(true);
  };

  async function handleEditTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamForEdit) return;
    setEditTeamError("");
    try {
      await updateTeam(selectedTeamForEdit.id, {
        name: editTeamName,
        description: editTeamDesc,
      });
      setEditTeamOpen(false);
      refreshTeams(); // Refresh lists
    } catch (err: unknown) {
      setEditTeamError(err instanceof Error ? err.message : "Failed to update team");
    }
  }

  async function handleQuickInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamForInvite) return;
    setInviteError("");
    setInviteSuccess("");
    try {
      await addTeamMember(selectedTeamForInvite.id, inviteEmail);
      setInviteSuccess(`Successfully invited ${inviteEmail}!`);
      setInviteEmail("");
      
      // Refresh member list for this team
      const updatedMembers = await getTeamMembers(selectedTeamForInvite.id);
      setTeamMembersMap((prev) => ({ ...prev, [selectedTeamForInvite.id]: updatedMembers }));
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

  // Get initials for overlapping avatar bubbles
  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  const personalBoards = boards.filter((b) => b.team_id === null || b.team_id === undefined);

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
            <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">+ Create Team</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                </DialogHeader>
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
                      placeholder="e.g. Mobile and desktop designers"
                    />
                  </div>
                  {teamError && <p className="text-sm text-red-500">{teamError}</p>}
                  <Button type="submit">Create Team</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Create Board Button (only on Personal page) */}
          {scope === "personal" && (
            <Dialog open={boardOpen} onOpenChange={setBoardOpen}>
              <DialogTrigger asChild>
                <Button>+ Create Board</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Personal Board</DialogTitle>
                </DialogHeader>
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
                  {boardError && <p className="text-sm text-red-500">{boardError}</p>}
                  <Button type="submit">Create Board</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Edit Team Settings Dialog */}
      <Dialog open={editTeamOpen} onOpenChange={setEditTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditTeam} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="editTeamName">Team Name</Label>
              <Input
                id="editTeamName"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="editTeamDesc">Description</Label>
              <Input
                id="editTeamDesc"
                value={editTeamDesc}
                onChange={(e) => setEditTeamDesc(e.target.value)}
              />
            </div>
            {editTeamError && <p className="text-sm text-red-500">{editTeamError}</p>}
            <Button type="submit">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Invite Dialog */}
      <Dialog open={quickInviteOpen} onOpenChange={(open) => {
        setQuickInviteOpen(open);
        if (!open) {
          setInviteEmail("");
          setInviteError("");
          setInviteSuccess("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to {selectedTeamForInvite?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <form onSubmit={handleQuickInvite} className="flex flex-col gap-3">
              <Label htmlFor="quickInviteEmail">Teammate's Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="quickInviteEmail"
                  type="email"
                  placeholder="coworker@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <Button type="submit">Send Invite</Button>
              </div>
            </form>
            {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
            {inviteSuccess && <p className="text-xs text-green-500 font-semibold">{inviteSuccess}</p>}
            <Button variant="secondary" onClick={() => setQuickInviteOpen(false)} className="mt-2">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Board Form for Scoped Team Board Creation */}
      <Dialog open={boardOpen} onOpenChange={setBoardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Board for {selectedTeamForBoard?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBoard} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="boardName">Board Name</Label>
              <Input
                id="boardName"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="e.g. Q3 Roadmap"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="boardDesc">Description</Label>
              <Input
                id="boardDesc"
                value={boardDesc}
                onChange={(e) => setBoardDesc(e.target.value)}
                placeholder="Scope of work details"
              />
            </div>
            {boardError && <p className="text-sm text-red-500">{boardError}</p>}
            <Button type="submit">Create Board</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Boards Grids */}
      <div className="flex flex-col gap-10">
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

        {/* Team Boards grouped by Team (only visible on "work" tab) */}
        {scope === "work" && (
          <div className="flex flex-col gap-10">
            {teams.length === 0 ? (
              <div className="h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 bg-muted/20">
                <p className="text-sm text-muted-foreground mb-4">
                  You don't have any teams yet. Create a team first to establish a workspace.
                </p>
                <Button onClick={() => setTeamOpen(true)}>Create Your First Team</Button>
              </div>
            ) : (
              teams.map((team) => {
                const teamBoardsList = boards.filter((b) => b.team_id === team.id);
                const members = teamMembersMap[team.id] || [];

                return (
                  <div key={team.id} className="border rounded-xl p-6 bg-card shadow-sm flex flex-col gap-6">
                    {/* Team Workspace Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-muted">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold">{team.name}</h2>
                          {/* Edit Team Settings inline trigger */}
                          <button
                            onClick={() => handleOpenEditTeam(team)}
                            className="text-muted-foreground hover:text-foreground text-[10px] bg-muted/50 hover:bg-muted px-1.5 py-0.5 rounded transition-all outline-none"
                            title="Edit Team Details"
                          >
                            Edit
                          </button>
                        </div>
                        {team.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{team.description}</p>
                        )}
                      </div>

                      {/* Team Members and Invite Action */}
                      <div className="flex items-center gap-3">
                        {/* Overlapping member bubbles */}
                        <div className="flex -space-x-2 overflow-hidden">
                          {members.map((m) => (
                            <div
                              key={m.user_id}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background text-[9px] font-bold ring-2 ring-card select-none"
                              title={`${m.name} (${m.email})`}
                            >
                              {getInitials(m.name)}
                            </div>
                          ))}
                        </div>
                        
                        {/* Quick Invite Button */}
                        <button
                          onClick={() => {
                            setSelectedTeamForInvite(team);
                            setQuickInviteOpen(true);
                          }}
                          className="text-xs bg-muted hover:bg-muted-foreground/15 border text-foreground font-medium px-2.5 py-1 rounded transition-colors"
                        >
                          + Invite
                        </button>
                      </div>
                    </div>

                    {/* Team Boards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {teamBoardsList.map((board) => (
                        <Card
                          key={board.id}
                          onClick={() => onSelectBoard(board)}
                          className="cursor-pointer hover:border-foreground/40 transition-all shadow-sm bg-background/50"
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

                      {/* Dashed Create Board trigger scoped directly to this team */}
                      <div
                        onClick={() => {
                          setSelectedTeamForBoard(team);
                          setBoardOpen(true);
                        }}
                        className="border-2 border-dashed rounded-xl hover:border-foreground/30 flex items-center justify-center cursor-pointer transition-all min-h-[110px] text-muted-foreground/60 hover:text-foreground/80 bg-background/20"
                      >
                        <span className="text-xs font-semibold">+ Create Board</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
