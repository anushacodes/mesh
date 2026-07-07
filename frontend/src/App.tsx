import { useEffect, useState } from "react";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import BoardPage from "@/pages/BoardPage";
import ProfilePage from "@/pages/Profile";
import { getCurrentUser, getTeams, logoutUser } from "@/lib/api";

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

type Board = {
  id: number;
  name: string;
  description?: string;
  team_id?: number;
};

type ViewState = "personal" | "work" | "board" | "profile";

export default function App() {
  const path = window.location.pathname;
  const token = localStorage.getItem("token");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Navigation states
  const [currentView, setCurrentView] = useState<ViewState>("personal");
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  
  // Triggers
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
      
      fetchTeamsList();
    }
  }, [token]);

  function fetchTeamsList() {
    getTeams()
      .then(setTeams)
      .catch(() => {});
  }

  if (path === "/register") return <RegisterPage />;
  if (path !== "/" && !token) {
    window.location.href = "/";
    return null;
  }

  // Handle Logged Out State
  if (!token) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation Bar */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Top Left: Brand and Navigation */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setActiveBoard(null);
                setCurrentView("personal");
              }}
              className="font-bold text-lg tracking-tight hover:opacity-80 outline-none"
            >
              Mesh
            </button>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <button
                onClick={() => {
                  setActiveBoard(null);
                  setCurrentView("personal");
                }}
                className={`transition-colors hover:text-foreground outline-none ${
                  currentView === "personal"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => {
                  setActiveBoard(null);
                  setCurrentView("work");
                }}
                className={`transition-colors hover:text-foreground outline-none ${
                  currentView === "work"
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                Work
              </button>
            </nav>
          </div>

          {/* Top Right: Clickable User profile badge & Logout */}
          <div className="flex items-center gap-4">
            {user && (
              <button
                onClick={() => {
                  setActiveBoard(null);
                  setCurrentView("profile");
                }}
                className={`text-xs px-2.5 py-1 rounded-md font-mono border transition-all outline-none ${
                  currentView === "profile" 
                    ? "bg-foreground text-background border-foreground font-bold" 
                    : "bg-muted text-muted-foreground border-transparent hover:border-foreground/30"
                }`}
                title="View Profile & Teams"
              >
                <span className="capitalize font-semibold">{user.role}</span>: {user.name}
              </button>
            )}

            <button
              onClick={() => {
                logoutUser();
              }}
              className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium border border-destructive/20 rounded px-3 py-1.5 bg-background hover:bg-destructive/5"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-background">
        {currentView === "profile" && (
          <ProfilePage user={user} />
        )}
        
        {currentView === "board" && activeBoard && (
          <BoardPage
            board={activeBoard}
            user={user}
            onBack={() => {
              setActiveBoard(null);
              // Fallback back to appropriate dashboard view
              setCurrentView(activeBoard.team_id ? "work" : "personal");
            }}
            newTaskOpen={newTaskOpen}
            setNewTaskOpen={setNewTaskOpen}
          />
        )}

        {(currentView === "personal" || currentView === "work") && (
          <Dashboard
            teams={teams}
            scope={currentView}
            refreshTeams={fetchTeamsList}
            onSelectBoard={(board) => {
              setActiveBoard(board);
              setCurrentView("board");
            }}
          />
        )}
      </main>
    </div>
  );
}
