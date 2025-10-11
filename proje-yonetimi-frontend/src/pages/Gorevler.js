// src/pages/Gorevler.js
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchTasks,
  addTask,
  updateTask,
  fetchProjects,
  fetchUsers,
  findUserByEmail,
  fetchTaskById,
  deleteTask, // opsiyonel
} from "../api";
import "./Gorevler.css";

export default function Gorevler() {
  const token = localStorage.getItem("access");

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  // filtreler
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [assigneeFilter, setAssigneeFilter] = useState("Tümü");

  // Ekle modal
  const [addOpen, setAddOpen] = useState(false);
  const [assigneeEmailAdd, setAssigneeEmailAdd] = useState("");
  const [formAdd, setFormAdd] = useState({
    title: "",
    description: "",
    project: "",
    assignee: "", // id olarak dolduracağız
    start_date: "",
    end_date: "",
    due_date: "",
    status: "Devam Ediyor",
    progress: 0,
  });

  // Görüntüle modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // Düzenle modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [assigneeEmailEdit, setAssigneeEmailEdit] = useState("");
  const [formEdit, setFormEdit] = useState({
    title: "",
    description: "",
    project: "",
    assignee: "",
    start_date: "",
    end_date: "",
    due_date: "",
    status: "Devam Ediyor",
    progress: 0,
  });

  // data yükle
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTasks(token), fetchProjects(token), fetchUsers(token)])
      .then(([t, p, u]) => {
        setTasks(t);
        setProjects(p);
        setUsers(u);
      })
      .catch(() => alert("Görevler/Projeler/Kullanıcılar alınamadı!"))
      .finally(() => setLoading(false));
  }, [token]);

  // assignee e-posta -> id eşleme (EKLE modalı)
  useEffect(() => {
    const found = users.find((u) => u.email === assigneeEmailAdd);
    setFormAdd((f) => ({ ...f, assignee: found ? found.id : "" }));
  }, [assigneeEmailAdd, users]);

  // assignee e-posta -> id eşleme (DÜZENLE modalı)
  useEffect(() => {
    const found = users.find((u) => u.email === assigneeEmailEdit);
    setFormEdit((f) => ({ ...f, assignee: found ? found.id : "" }));
  }, [assigneeEmailEdit, users]);

  // Filtrelenmiş liste
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const statusOk =
        statusFilter === "Tümü" ? true : (t.status || "") === statusFilter;
      const assigneeName = t.assignee_name || t.assignee || "-";
      const assigneeOk =
        assigneeFilter === "Tümü" ? true : assigneeName === assigneeFilter;
      return statusOk && assigneeOk;
    });
  }, [tasks, statusFilter, assigneeFilter]);

  // ————— E K L E —————
  const openAdd = () => {
    setFormAdd({
      title: "",
      description: "",
      project: projects[0]?.id || "",
      assignee: "",
      start_date: "",
      end_date: "",
      due_date: "",
      status: "Devam Ediyor",
      progress: 0,
    });
    setAssigneeEmailAdd("");
    setAddOpen(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const assigneeId = formAdd.assignee || null;
      const payload = { ...formAdd, assignee: assigneeId || null };
      const created = await addTask(payload, token);
      setTasks((prev) => [created, ...prev]);
      setAddOpen(false);
    } catch (err) {
      alert(err.message || "Görev eklenemedi!");
    }
  };

  // ————— G Ö R Ü N T Ü L E —————
  const openView = async (id) => {
    try {
      const data = await fetchTaskById(id, token);
      setViewData(data);
      setViewOpen(true);
    } catch (e) {
      alert(e.message || "Görev alınamadı");
    }
  };

  // ————— D Ü Z E N L E —————
  const openEdit = async (id) => {
    try {
      const data = await fetchTaskById(id, token);
      setEditId(id);
      setFormEdit({
        title: data.title || "",
        description: data.description || "",
        project: data.project || "",
        assignee: data.assignee || "",
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        due_date: data.due_date || "",
        status: data.status || "Devam Ediyor",
        progress: Number(data.progress || 0),
      });
      // e-posta inputunu doldur
      const found = users.find((u) => u.id === data.assignee);
      setAssigneeEmailEdit(found?.email || "");
      setEditOpen(true);
    } catch (e) {
      alert(e.message || "Görev alınamadı");
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const assigneeId = formEdit.assignee || null;
      const payload = { ...formEdit, assignee: assigneeId || null };
      const updated = await updateTask(editId, payload, token);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      setEditOpen(false);
    } catch (e) {
      alert(e.message || "Görev güncellenemedi");
    }
  };

  // ————— S İ L (opsiyonel) —————
  const handleDelete = async (id) => {
    if (!window.confirm("Görevi silmek istediğine emin misin?")) return;
    try {
      await deleteTask(id, token);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e.message || "Görev silinemedi");
    }
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h2>Görevler</h2>
        <button className="tasks-btn" onClick={openAdd}>+ Yeni Görev</button>
      </div>

      {/* filtreler */}
      <div className="tasks-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>Tümü</option>
          <option>Devam Ediyor</option>
          <option>Tamamlandı</option>
          <option>Beklemede</option>
        </select>

        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
          <option>Tümü</option>
          {Array.from(new Set(tasks.map((t) => t.assignee_name || t.assignee).filter(Boolean))).map((n, i) => (
            <option key={i} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="tasks-list">
        {loading ? (
          <div>Yükleniyor...</div>
        ) : filteredTasks.length === 0 ? (
          <div>Gösterilecek görev yok.</div>
        ) : (
          filteredTasks.map((task) => (
            <div className="task-card" key={task.id}>
              <div className="task-card-header">
                <span className="task-title">{task.title}</span>
                <span className="task-priority düşük">{task.project_name || "-"}</span>
              </div>

              <div className="task-desc">{task.description || "-"}</div>

              <div className="task-info">
                <b>Proje:</b> {task.project_name || "-"}
                <br />
                <b>Atanan:</b> {task.assignee_name || "-"}
                <br />
                <b>Başlangıç:</b> {task.start_date || "-"}
                <br />
                <b>Bitiş:</b> {task.end_date || "-"}
                <br />
                <b>Son Tarih:</b> {task.due_date || "-"}
              </div>

              <div className="task-progress">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${task.progress || 0}%`, background: "#4F8CFF" }}
                  />
                </div>
                <span className="progress-label">{task.progress || 0}% {task.status}</span>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  className="tasks-btn"
                  style={{ background: "#e8eaf6", color: "#333" }}
                  onClick={() => openEdit(task.id)}
                >
                  Düzenle
                </button>
                <button
                  className="tasks-btn"
                  style={{ background: "#f1f1ff", color: "#333" }}
                  onClick={() => openView(task.id)}
                >
                  Görüntüle
                </button>
                {/* Silmek istemezsen bu butonu kaldır */}
                <button
                  className="tasks-btn"
                  style={{ background: "#ffe8e8", color: "#c62828" }}
                  onClick={() => handleDelete(task.id)}
                >
                  Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ——— Görüntüle Modal ——— */}
      {viewOpen && viewData && (
        <div className="modal-bg">
          <div
            className="modal-icerik"
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              width: 520,
              margin: "40px auto",
              boxShadow: "0 4px 24px rgba(80,99,250,0.11)",
            }}
          >
            <h3 style={{ marginBottom: 12 }}>{viewData.title}</h3>
            <p style={{ color: "#666" }}>{viewData.description || "-"}</p>
            <div style={{ marginTop: 10, fontSize: 15 }}>
              <b>Proje:</b> {viewData.project_name || "-"} <br />
              <b>Atanan:</b> {viewData.assignee_name || "-"} <br />
              <b>Başlangıç:</b> {viewData.start_date || "-"} <br />
              <b>Bitiş:</b> {viewData.end_date || "-"} <br />
              <b>Son Tarih:</b> {viewData.due_date || "-"} <br />
              <b>Durum:</b> {viewData.status || "-"} <br />
              <b>İlerleme:</b> %{viewData.progress || 0}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                className="tasks-btn"
                style={{ background: "#726bfa", color: "#fff" }}
                onClick={() => setViewOpen(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ——— Düzenle Modal ——— */}
      {editOpen && (
        <div className="modal-bg">
          <div
            className="modal-icerik"
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              width: 520,
              margin: "40px auto",
              boxShadow: "0 4px 24px rgba(80,99,250,0.11)",
            }}
          >
            <h3 style={{ marginBottom: 12 }}>Görevi Düzenle</h3>
            <form style={{ display: "flex", flexDirection: "column", gap: 12 }} onSubmit={handleEditSave}>
              <label>
                Başlık:
                <input
                  type="text"
                  required
                  value={formEdit.title}
                  onChange={(e) => setFormEdit({ ...formEdit, title: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Açıklama:
                <textarea
                  value={formEdit.description}
                  onChange={(e) => setFormEdit({ ...formEdit, description: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8, minHeight: 60 }}
                />
              </label>

              <label>
                Proje:
                <select
                  required
                  value={formEdit.project}
                  onChange={(e) => setFormEdit({ ...formEdit, project: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                >
                  <option value="">Seçiniz</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Atanan (E-posta):
                <input
                  type="email"
                  placeholder="Kullanıcı e-posta"
                  list="assignee-email-list-edit"
                  value={assigneeEmailEdit}
                  onChange={(e) => setAssigneeEmailEdit(e.target.value)}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
                <datalist id="assignee-email-list-edit">
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>{u.first_name} {u.last_name}</option>
                  ))}
                </datalist>
              </label>

              <label>
                Başlangıç:
                <input
                  type="date"
                  value={formEdit.start_date}
                  onChange={(e) => setFormEdit({ ...formEdit, start_date: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Bitiş:
                <input
                  type="date"
                  value={formEdit.end_date}
                  onChange={(e) => setFormEdit({ ...formEdit, end_date: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Son Tarih:
                <input
                  type="date"
                  value={formEdit.due_date}
                  onChange={(e) => setFormEdit({ ...formEdit, due_date: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Durum:
                <select
                  value={formEdit.status}
                  onChange={(e) => setFormEdit({ ...formEdit, status: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                >
                  <option>Devam Ediyor</option>
                  <option>Tamamlandı</option>
                  <option>Beklemede</option>
                </select>
              </label>

              <label>
                İlerleme (%):
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formEdit.progress}
                  onChange={(e) => setFormEdit({ ...formEdit, progress: Number(e.target.value) })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8, width: 100 }}
                />
              </label>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="submit" className="tasks-btn" style={{ background: "#726bfa", color: "#fff" }}>
                  Kaydet
                </button>
                <button type="button" className="tasks-btn" style={{ background: "#eee", color: "#333" }} onClick={() => setEditOpen(false)}>
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ——— Ekle Modal ——— */}
      {addOpen && (
        <div className="modal-bg">
          <div
            className="modal-icerik"
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              width: 520,
              margin: "40px auto",
              boxShadow: "0 4px 24px rgba(80,99,250,0.11)",
            }}
          >
            <h3 style={{ marginBottom: 12 }}>Yeni Görev Ekle</h3>
            <form style={{ display: "flex", flexDirection: "column", gap: 12 }} onSubmit={handleAdd}>
              <input
                type="text"
                placeholder="Görev Adı"
                required
                value={formAdd.title}
                onChange={(e) => setFormAdd({ ...formAdd, title: e.target.value })}
                style={{ padding: 10, borderRadius: 6, border: "1px solid #e2e2e2" }}
              />

              <textarea
                placeholder="Açıklama"
                value={formAdd.description}
                onChange={(e) => setFormAdd({ ...formAdd, description: e.target.value })}
                style={{ padding: 10, borderRadius: 6, border: "1px solid #e2e2e2", minHeight: 48 }}
              />

              <label>
                Proje:
                <select
                  required
                  value={formAdd.project}
                  onChange={(e) => setFormAdd({ ...formAdd, project: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                >
                  <option value="">Seçiniz</option>
                  {projects.map((proje) => (
                    <option key={proje.id} value={proje.id}>{proje.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Atanan (E-posta):
                <input
                  type="email"
                  placeholder="Kullanıcı e-posta"
                  list="assignee-email-list-add"
                  value={assigneeEmailAdd}
                  onChange={(e) => setAssigneeEmailAdd(e.target.value)}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
                <datalist id="assignee-email-list-add">
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>{u.first_name} {u.last_name}</option>
                  ))}
                </datalist>
              </label>

              <label>
                Başlangıç:
                <input
                  type="date"
                  value={formAdd.start_date}
                  onChange={(e) => setFormAdd({ ...formAdd, start_date: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Bitiş:
                <input
                  type="date"
                  value={formAdd.end_date}
                  onChange={(e) => setFormAdd({ ...formAdd, end_date: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Son Tarih:
                <input
                  type="date"
                  value={formAdd.due_date}
                  onChange={(e) => setFormAdd({ ...formAdd, due_date: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Durum:
                <select
                  value={formAdd.status}
                  onChange={(e) => setFormAdd({ ...formAdd, status: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                >
                  <option>Devam Ediyor</option>
                  <option>Tamamlandı</option>
                  <option>Beklemede</option>
                </select>
              </label>

              <label>
                İlerleme (%):
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formAdd.progress}
                  onChange={(e) => setFormAdd({ ...formAdd, progress: Number(e.target.value) })}
                  style={{ padding: 8, borderRadius: 6, width: 90, marginLeft: 8 }}
                />
              </label>

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button type="submit" className="tasks-btn" style={{ background: "#726bfa", color: "#fff" }}>
                  Ekle
                </button>
                <button type="button" className="tasks-btn" style={{ background: "#eee", color: "#333" }} onClick={() => setAddOpen(false)}>
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
