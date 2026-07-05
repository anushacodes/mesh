import { useEffect, useState } from "react";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import TeamsPage from "@/pages/Teams";
import { getCurrentUser, getTeams } from "@/lib/api";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Team = {
  id: number;
  name: string;
};

export default function App() {
  const path = window.location.pathname;
  const token = localStorage.getItem("token");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [refreshTasksTrigger, setRefreshTasksTrigger] = useState(0);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  // Authentication Guards & Fetch Info
  useEffect(() => {
    if (token) {
      getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("token");
          window.location.href = "/";
        });
      getTeams()
        .then((data) => {
          setTeams(data);
          if (data.length > 0) {
            setSelectedTeam(data[0]); // Default to first team if available
          }
        })
        .catch(() => {});
    }
  }, [token]);

  if (path === "/register") return <RegisterPage />;
  if (path === "/dashboard" || path === "/teams" || path === "/") {
    if (!token) {
      window.location.href = "/";
      return null;
    }
  } else {
    window.location.href = "/";
    return null;
  }

  const activeTab = path === "/teams" ? "teams" : "dashboard";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation Bar */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Top Left: Brand and Navigation */}
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="font-bold text-lg tracking-tight hover:opacity-80">
              Mesh
            </a>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <a
                href="/dashboard"
                className={`transition-colors hover:text-foreground ${
                  activeTab === "dashboard" ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                Dashboard
              </a>
              <a
                href="/teams"
                className={`transition-colors hover:text-foreground ${
                  activeTab === "teams" ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                Teams
              </a>
            </nav>
          </div>

          {/* Top Right: User context and controls */}
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md font-mono">
                <span className="capitalize font-semibold">{user.role}</span>: {user.name}
              </span>
            )}
            
            {activeTab === "dashboard" && (
              <button
                onClick={() => setNewTaskOpen(true)}
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-3 py-1.5 rounded-md transition-colors shadow-sm"
              >
                + New Task
              </button>
            )}

            <button
              onClick={() => {
                if (user) {
                  alert(`Profile Details:\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}`);
                }
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium border rounded px-3 py-1.5 bg-background hover:bg-muted"
            >
              Profile
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/";
              }}
              className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium border border-destructive/20 rounded px-3 py-1.5 bg-background hover:bg-destructive/5"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header Area */}
      {token && (
        <div className="border-b bg-muted/20">
          <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {/* Dropdown or select to change team scope */}
              {teams.length > 0 ? (
                <select
                  value={selectedTeam?.id || ""}
                  onChange={(e) => {
                    const selected = teams.find((t) => t.id === parseInt(e.target.value));
                    setSelectedTeam(selected || null);
                  }}
                  className="bg-transparent border border-muted px-2 py-0.5 rounded text-foreground font-semibold cursor-pointer outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-foreground">Personal Space</span>
              )}
              <span>&gt;</span>
              <a href="/dashboard" className="hover:text-foreground font-medium transition-colors">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === "teams" ? (
          <TeamsPage />
        ) : (
          <Dashboard
            newTaskOpen={newTaskOpen}
            setNewTaskOpen={setNewTaskOpen}
            refreshTrigger={refreshTasksTrigger}
            setRefreshTrigger={setRefreshTasksTrigger}
          />
        )}
      </main>
    </div>
  );
}
