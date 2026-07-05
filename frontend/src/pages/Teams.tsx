import { useEffect, useState } from "react";
import { getTeams, createTeam, deleteTeam, getTeamMembers, addTeamMember } from "@/lib/api";
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
  created_at: string;
};

type Member = {
  user_id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  
  // Dialog / form state for Create Team
  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [createError, setCreateError] = useState("");

  // Add Member state
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [memberSuccess, setMemberSuccess] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchMembers(selectedTeam.id);
    } else {
      setMembers([]);
    }
  }, [selectedTeam]);

  async function fetchTeams() {
    try {
      const data = await getTeams();
      setTeams(data);
    } catch {
      // Handle error silently or alert
    }
  }

  async function fetchMembers(teamId: number) {
    try {
      const data = await getTeamMembers(teamId);
      setMembers(data);
    } catch {
      // Handle error
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    try {
      const newTeam = await createTeam({ name: teamName, description: teamDesc });
      setTeams((prev) => [...prev, newTeam]);
      setTeamName("");
      setTeamDesc("");
      setCreateOpen(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create team");
    }
  }

  async function handleDeleteTeam(id: number, e: React.MouseEvent) {
    e.stopPropagation(); // don't trigger select team
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t.id !== id));
      if (selectedTeam?.id === id) {
        setSelectedTeam(null);
      }
    } catch {
      alert("Failed to delete team");
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeam) return;
    setMemberError("");
    setMemberSuccess("");
    try {
      const newMember = await addTeamMember(selectedTeam.id, memberEmail);
      setMembers((prev) => [...prev, newMember]);
      setMemberEmail("");
      setMemberSuccess("Member added successfully!");
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Teams Management</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Create Team</Button>
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
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="teamDesc">Description</Label>
                <Input
                  id="teamDesc"
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                />
              </div>
              {createError && <p className="text-sm text-red-500">{createError}</p>}
              <Button type="submit">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Teams List (2 Columns on MD screens) */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Your Teams
          </h2>
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">You don't own any teams yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`cursor-pointer transition-all hover:border-foreground/40 ${
                    selectedTeam?.id === team.id ? "border-foreground" : ""
                  }`}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <CardTitle className="text-base font-semibold">{team.name}</CardTitle>
                    <button
                      onClick={(e) => handleDeleteTeam(team.id, e)}
                      className="text-muted-foreground hover:text-destructive text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {team.description || "No description provided."}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Selected Team Details / Add Members (1 Column) */}
        <div className="bg-muted/40 rounded-lg border p-4">
          {selectedTeam ? (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedTeam.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTeam.description || "No description."}
                </p>
              </div>

              <hr className="border-muted" />

              {/* Add Member Form */}
              <form onSubmit={handleAddMember} className="flex flex-col gap-3">
                <Label className="text-xs font-semibold uppercase" htmlFor="email">
                  Invite Member
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                  <Button type="submit" size="sm" className="h-9">
                    Add
                  </Button>
                </div>
                {memberError && <p className="text-xs text-red-500">{memberError}</p>}
                {memberSuccess && <p className="text-xs text-green-500">{memberSuccess}</p>}
              </form>

              <hr className="border-muted" />

              {/* Members List */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                  Members ({members.length})
                </h4>
                <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-1">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-2 bg-background border rounded-md"
                    >
                      <div>
                        <p className="text-xs font-medium">{member.name}</p>
                        <p className="text-[10px] text-muted-foreground">{member.email}</p>
                      </div>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono capitalize">
                        {member.role}
                      </span>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No members in this team yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-center text-muted-foreground text-sm">
              Select a team to manage members and invites.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
