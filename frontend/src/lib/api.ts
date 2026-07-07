const BASE_URL = "http://localhost:8000";

// Helper to fetch authorization headers
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

// Silent Refresh Token Rotation helper
async function silentRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const res = await fetch(`${BASE_URL}/app/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data.access_token;
}

// Request Interceptor Wrapper to handle 401 Silent Token Rotations
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Set headers
  const headers = {
    ...authHeaders(),
    ...(options.headers || {}),
  };
  
  let response = await fetch(url, { ...options, headers });

  // If unauthorized, attempt to rotate refresh token
  if (response.status === 401) {
    try {
      const newAccessToken = await silentRefresh();
      // Retry the request with the new access token
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      response = await fetch(url, { ...options, headers: retryHeaders });
    } catch {
      // Clear storage and redirect to login if session is expired
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
  }

  return response;
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
  const data = await res.json();
  
  // Store both tokens
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  
  return data;
}

export async function logoutUser() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (refreshToken) {
    try {
      await fetch(`${BASE_URL}/app/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {}
  }
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/";
}

export async function getCurrentUser() {
  const res = await fetchWithAuth(`${BASE_URL}/app/user/me`);
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function getTasks(boardId: number) {
  const res = await fetchWithAuth(`${BASE_URL}/app/tasks/?board_id=${boardId}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(data: { title: string; board_id: number; description?: string; status?: string; priority?: string; assignee_id?: number | null }) {
  const res = await fetchWithAuth(`${BASE_URL}/app/tasks/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create task");
  }
  return res.json();
}

export async function updateTask(taskId: number, data: { status?: string; title?: string; description?: string; priority?: string; assignee_id?: number | null; tags?: string | null }) {
  const res = await fetchWithAuth(`${BASE_URL}/app/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(taskId: number) {
  const res = await fetchWithAuth(`${BASE_URL}/app/tasks/${taskId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete task");
}

// Teams APIs
export async function getTeams() {
  const res = await fetchWithAuth(`${BASE_URL}/app/teams/`);
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

export async function createTeam(data: { name: string; description?: string }) {
  const res = await fetchWithAuth(`${BASE_URL}/app/teams/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create team");
  }
  return res.json();
}

export async function deleteTeam(teamId: number) {
  const res = await fetchWithAuth(`${BASE_URL}/app/teams/${teamId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete team");
}

export async function updateTeam(teamId: number, data: { name?: string; description?: string }) {
  const res = await fetchWithAuth(`${BASE_URL}/app/teams/${teamId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update team");
  return res.json();
}

export async function getTeamMembers(teamId: number) {
  const res = await fetchWithAuth(`${BASE_URL}/app/teams/${teamId}/members`);
  if (!res.ok) throw new Error("Failed to fetch team members");
  return res.json();
}

export async function addTeamMember(teamId: number, email: string) {
  const res = await fetchWithAuth(`${BASE_URL}/app/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to add team member");
  }
  return res.json();
}

// Boards APIs
export async function getBoards() {
  const res = await fetchWithAuth(`${BASE_URL}/app/boards/`);
  if (!res.ok) throw new Error("Failed to fetch boards");
  return res.json();
}

export async function createBoard(data: { name: string; description?: string; team_id?: number }) {
  const res = await fetchWithAuth(`${BASE_URL}/app/boards/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create board");
  }
  return res.json();
}

export async function deleteBoard(boardId: number) {
  const res = await fetchWithAuth(`${BASE_URL}/app/boards/${boardId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete board");
}

export async function updateBoard(boardId: number, data: { name?: string; description?: string }) {
  const res = await fetchWithAuth(`${BASE_URL}/app/boards/${boardId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update board");
  return res.json();
}
