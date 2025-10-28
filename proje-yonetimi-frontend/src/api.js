const API_BASE = "http://localhost:8000/api/";

// ---- PROJELER ----
export async function fetchProjects(token) {
  const res = await fetch(API_BASE + "projects/", {
    headers: {
      ...(token && { "Authorization": `Bearer ${token}` }),
    }
  });
  if (!res.ok) throw new Error("Projeler alınamadı");
  return await res.json();
}



export async function addProject(data, token) {
  const res = await fetch(API_BASE + "projects/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    // Hata mesajını da console'a bas, anlaman kolay olsun!
    const errorData = await res.json();
    console.error("Proje eklenemedi:", errorData);
    throw new Error("Proje eklenemedi");
  }
  return await res.json();
}


// ---- GÖREVLER ----
export async function fetchTasks(token) {
  const res = await fetch(API_BASE + "tasks/", {
    headers: {
      ...(token && { "Authorization": `Bearer ${token}` }),
    }
  });
  if (!res.ok) throw new Error("Görevler alınamadı");
  return await res.json();
}

export async function addTask(data, token) {
  const res = await fetch(API_BASE + "tasks/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Görev eklenemedi");
  return await res.json();
}

export async function findUserByEmail(email, token) {
  const res = await fetch(`http://localhost:8000/api/users/find-by-email/?email=${encodeURIComponent(email)}`, {
    ...(token && { headers: { "Authorization": `Bearer ${token}` } }),
  });
  if (!res.ok) throw new Error("Kullanıcı bulunamadı");
  return await res.json();
}


// ---- KULLANICI GİRİŞ/KAYIT ----
export async function loginUser(email, password) {
  const res = await fetch(API_BASE + "users/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return await res.json();
}

export async function googleLogin(credential) {
  const res = await fetch(API_BASE + "users/google-login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });

  const text = await res.text().catch(() => "");
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    console.error("Google login yanıtı çözümlenemedi", err);
  }

  if (!res.ok) {
    const detail = data?.detail || data?.error || "Google ile giriş yapılamadı.";
    throw new Error(detail);
  }

  return data;
}

export async function fetchGoogleConfig() {
  const res = await fetch(API_BASE + "users/google-config/");

  const text = await res.text().catch(() => "");
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("Google yapılandırması çözümlenemedi", error);
  }

  if (!res.ok) {
    const detail = data?.detail || data?.error || "Google yapılandırması alınamadı.";
    throw new Error(detail);
  }

  return {
    client_id: data?.client_id || "",
    enabled: Boolean(data?.enabled && data?.client_id),
    raw: data,
  };
}

export async function registerUser(data) {
  const res = await fetch(API_BASE + "users/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
}

/*export async function fetchDashboardSummary(token) {
  const res = await fetch("http://localhost:8000/api/projects/", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Dashboard verileri alınamadı");
  return await res.json();
}*/

// src/api.js
export async function fetchMe(token) {
  const res = await fetch("http://localhost:8000/api/users/me/", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Kullanıcı bilgisi alınamadı");
  return await res.json();
}

export async function fetchUsers(token) {
  const res = await fetch(API_BASE + "users/", {
    headers: {
      ...(token && { "Authorization": `Bearer ${token}` }),
    }
  });
  if (!res.ok) throw new Error("Kullanıcılar alınamadı");
  return await res.json();
}

//gantt chart
export async function fetchGanttTasks(projectId, token) {
  const res = await fetch(`http://localhost:8000/api/tasks/gantt/?project_id=${projectId}`, {
    headers: {
      ...(token && { "Authorization": `Bearer ${token}` }),
    }
  });
  if (!res.ok) throw new Error("Gantt görevleri alınamadı");
  return await res.json();
}

export async function updateTask(id, data, token) {
  const res = await fetch(`http://localhost:8000/api/tasks/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Görev güncellenemedi");
  return await res.json();
}

/*export async function fetchDashboardSummary(token) {
  const res = await fetch("http://localhost:8000/api/dashboard/summary/", {
    headers: { ...(token && { "Authorization": `Bearer ${token}` }) }
  });
  if (!res.ok) throw new Error("Dashboard verileri alınamadı");
  return await res.json();
}*/

/*export async function fetchDashboardSummary(token) {
  const url = "http://localhost:8000/api/dashboard/summary/";
  const res = await fetch(url, {
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  });

  // Tanı koymak için ayrıntılı log
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[Dashboard] HTTP", res.status, res.statusText, "->", text);
    console.error("[Dashboard] Token var mı?", !!token, "Token:", token);
    throw new Error("Dashboard verileri alınamadı");
  }
  return await res.json();
}*/

// api.js
export async function fetchDashboardSummary(token) {
  const url = "http://localhost:8000/api/dashboard/summary/";
  const res = await fetch(url, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[Dashboard] HTTP", res.status, res.statusText, "->", text);
    throw new Error(`Dashboard verileri alınamadı (HTTP ${res.status})`);
  }
  const d = await res.json();

  // snake_case -> camelCase
  return {
    totalProjects:  d.total_projects,
    activeTasks:    d.active_tasks,
    completed:      d.completed,
    members:        d.members,
    recentProjects: d.recent_projects,
    upcomingTasks:  d.upcoming_tasks,
  };
}




// ---- PROJELER: detay, güncelle, sil ----
export async function fetchProjectById(id, token) {
  const res = await fetch(`http://localhost:8000/api/projects/${id}/`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Proje bulunamadı");
  return await res.json();
}

export async function updateProject(id, data, token) {
  const res = await fetch(`http://localhost:8000/api/projects/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Proje güncellenemedi");
  return await res.json();
}

export async function deleteProject(id, token) {
  const res = await fetch(`http://localhost:8000/api/projects/${id}/`, {
    method: "DELETE",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Proje silinemedi");
  return true;
}

export async function fetchReportsSummary(token) {
  const res = await fetch("http://localhost:8000/api/tasks/reports/summary/", {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error("Rapor özeti alınamadı");
  return await res.json();
}
// GÜNCELLEME (PATCH)
export async function updateUser(id, data, token) {
  const res = await fetch(`http://localhost:8000/api/users/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Kullanıcı güncellenemedi");
  return await res.json();
}
// Tek görev getir
export async function fetchTaskById(id, token) {
  const res = await fetch(`http://localhost:8000/api/tasks/${id}/`, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) throw new Error("Görev alınamadı");
  return await res.json();
}

// (Opsiyonel) Görev sil — kullanmak istemezsen butonu gösterme
export async function deleteTask(id, token) {
  const res = await fetch(`http://localhost:8000/api/tasks/${id}/`, {
    method: "DELETE",
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) throw new Error("Görev silinemedi");
  return true;
}

// ---- DİĞER (Takvim, Rapor, Gantt) örnekleri de bu mantıkta eklenebilir ----
