const BASE_URL = "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function registerUser(name: string, email: string, password: string) {
  const res = await fetch(`${BASE_URL}/app/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/app/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch(`${BASE_URL}/app/user/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}


export async function getTasks() {
  const res = await fetch(`${BASE_URL}/app/tasks/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(data: { title: string; description?: string; status?: string; priority?: string }) {
  const res = await fetch(`${BASE_URL}/app/tasks/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create task");
  }
  return res.json();
}

export async function updateTask(taskId: number, data: { status?: string; title?: string; description?: string; priority?: string }) {
  const res = await fetch(`${BASE_URL}/app/tasks/${taskId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(taskId: number) {
  const res = await fetch(`${BASE_URL}/app/tasks/${taskId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete task");
}

// Teams APIs
export async function getTeams() {
  const res = await fetch(`${BASE_URL}/app/teams/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

export async function createTeam(data: { name: string; description?: string }) {
  const res = await fetch(`${BASE_URL}/app/teams/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create team");
  }
  return res.json();
}

export async function deleteTeam(teamId: number) {
  const res = await fetch(`${BASE_URL}/app/teams/${teamId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete team");
}

export async function getTeamMembers(teamId: number) {
  const res = await fetch(`${BASE_URL}/app/teams/${teamId}/members`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch team members");
  return res.json();
}

export async function addTeamMember(teamId: number, email: string) {
  const res = await fetch(`${BASE_URL}/app/teams/${teamId}/members`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to add team member");
  }
  return res.json();
}

