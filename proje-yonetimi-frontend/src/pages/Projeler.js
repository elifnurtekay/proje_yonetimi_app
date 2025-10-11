// src/pages/Projeler.js
import React, { useEffect, useState } from "react";
import {
  fetchProjects,
  fetchProjectById,
  updateProject,
  deleteProject,
  addProject,             // ⬅️ eklendi
} from "../api";
import { ensureEffectiveProgress, ensureListEffectiveProgress } from "../utils/progress";
import "./Gorevler.css";   // kart ve buton stillerini burada kullanıyoruz

export default function Projeler() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "Aktif",
    progress: 0,
    start_date: "",
    end_date: "",
  });

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    status: "Aktif",
    progress: 0,
    start_date: "",
    end_date: "",
  });

  const token = localStorage.getItem("access");

  useEffect(() => {
    setLoading(true);
    fetchProjects(token)
      .then((data) => ensureListEffectiveProgress(data, { startKey: "start_date", endKey: "end_date" }))
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProjects((prev) => ensureListEffectiveProgress(prev, { startKey: "start_date", endKey: "end_date" }, true));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Görüntüle
  const handleView = async (id) => {
    try {
      const data = await fetchProjectById(id, token);
      setViewData(ensureEffectiveProgress(data, { startKey: "start_date", endKey: "end_date" }));
      setViewOpen(true);
    } catch (e) {
      alert(e.message || "Proje alınamadı");
    }
  };

  // Düzenle aç
  const handleEditOpen = async (id) => {
    try {
      const data = await fetchProjectById(id, token);
      const enriched = ensureEffectiveProgress(data, { startKey: "start_date", endKey: "end_date" });
      setEditId(id);
      setEditForm({
        name: enriched.name || "",
        description: enriched.description || "",
        status: enriched.status || "Aktif",
        progress: Number(enriched.progress || 0),
        start_date: enriched.start_date || "",
        end_date: enriched.end_date || "",
      });
      setEditOpen(true);
    } catch (e) {
      alert(e.message || "Proje alınamadı");
    }
  };

  // Düzenle kaydet
  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...editForm,
        progress: Number(editForm.progress || 0),
      };
      const updated = await updateProject(editId, body, token);
      const normalized = ensureEffectiveProgress(updated, { startKey: "start_date", endKey: "end_date" }, true);
      setProjects((prev) => prev.map((p) => (p.id === normalized.id ? { ...p, ...normalized } : p)));
      setEditOpen(false);
    } catch (e) {
      alert(e.message || "Proje güncellenemedi");
    }
  };

  // Sil
  const handleDelete = async (id) => {
    if (!window.confirm("Bu projeyi silmek istediğine emin misin?")) return;
    try {
      await deleteProject(id, token);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message || "Proje silinemedi");
    }
  };

  // Yeni Proje -> Kaydet
  const handleAddSave = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...addForm,
        progress: Number(addForm.progress || 0),
      };
      const created = await addProject(body, token);
      const normalized = ensureEffectiveProgress(created, { startKey: "start_date", endKey: "end_date" }, true);
      setProjects((prev) => [normalized, ...prev]);
      setAddOpen(false);
      setAddForm({
        name: "",
        description: "",
        status: "Aktif",
        progress: 0,
        start_date: "",
        end_date: "",
      });
    } catch (e) {
      alert(e.message || "Proje eklenemedi");
    }
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header" style={{ justifyContent: "space-between" }}>
        <h2>Projeler</h2>

        {/* + Yeni Proje butonu */}
        <button
          className="tasks-btn"
          onClick={() => setAddOpen(true)}
          style={{ background: "#6d55e6", color: "#fff" }}
        >
          + Yeni Proje
        </button>
      </div>

      {loading ? (
        <div>Yükleniyor...</div>
      ) : projects.length === 0 ? (
        <div>Gösterilecek proje yok.</div>
      ) : (
        <div
          className="tasks-list"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))" }}
        >
          {projects.map((p) => (
            <div className="task-card" key={p.id}>
              <div className="task-card-header">
                <span className="task-title">{p.name}</span>
                <span className="task-priority düşük">{p.status || "Aktif"}</span>
              </div>

              <div className="task-desc">{p.description || "-"}</div>

              <div className="task-info">
                <b>Başlangıç:</b> {p.start_date || "-"}
                <br />
                <b>Bitiş:</b> {p.end_date || "-"}
                <br />
                <b>İlerleme:</b> %{p.effective_progress ?? p.progress ?? 0}
                {typeof p.progress === "number" && p.progress !== p.effective_progress ? (
                  <span className="progress-note">(manuel %{p.progress})</span>
                ) : null}
              </div>

              <div className="task-progress">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${p.effective_progress ?? p.progress ?? 0}%`, background: "#7C4DFF" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  className="tasks-btn"
                  style={{ background: "#e8eaf6", color: "#333" }}
                  onClick={() => handleEditOpen(p.id)}
                >
                  Düzenle
                </button>
                <button
                  className="tasks-btn"
                  style={{ background: "#f1f1ff", color: "#333" }}
                  onClick={() => handleView(p.id)}
                >
                  Görüntüle
                </button>
                <button
                  className="tasks-btn"
                  style={{ background: "#ffe8e8", color: "#c62828" }}
                  onClick={() => handleDelete(p.id)}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Görüntüle Modal */}
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
            <h3 style={{ marginBottom: 12 }}>{viewData.name}</h3>
            <p style={{ color: "#666" }}>{viewData.description || "-"}</p>
            <div style={{ marginTop: 10, fontSize: 15 }}>
              <b>Durum:</b> {viewData.status || "Aktif"}
              <br />
              <b>Başlangıç:</b> {viewData.start_date || "-"}
              <br />
              <b>Bitiş:</b> {viewData.end_date || "-"}
              <br />
              <b>İlerleme:</b> %{viewData.effective_progress ?? viewData.progress ?? 0}
              {typeof viewData.progress === "number" && viewData.progress !== viewData.effective_progress ? (
                <span className="progress-note">manuel %{viewData.progress}</span>
              ) : null}
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

      {/* Düzenle Modal */}
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
            <h3 style={{ marginBottom: 12 }}>Projeyi Düzenle</h3>
            <form
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
              onSubmit={handleEditSave}
            >
              <label>
                İsim:
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Açıklama:
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8, minHeight: 60 }}
                />
              </label>

              <label>
                Durum:
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                >
                  <option>Aktif</option>
                  <option>Beklemede</option>
                  <option>Arşiv</option>
                </select>
              </label>

              <label>
                İlerleme (%):
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.progress}
                  onChange={(e) =>
                    setEditForm({ ...editForm, progress: Number(e.target.value) })
                  }
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8, width: 110 }}
                />
              </label>

              <label>
                Başlangıç Tarihi:
                <input
                  type="date"
                  value={editForm.start_date || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, start_date: e.target.value })
                  }
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Bitiş Tarihi:
                <input
                  type="date"
                  value={editForm.end_date || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, end_date: e.target.value })
                  }
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  type="submit"
                  className="tasks-btn"
                  style={{ background: "#726bfa", color: "#fff" }}
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  className="tasks-btn"
                  style={{ background: "#eee", color: "#333" }}
                  onClick={() => setEditOpen(false)}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Proje Modal */}
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
            <h3 style={{ marginBottom: 12 }}>Yeni Proje</h3>
            <form
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
              onSubmit={handleAddSave}
            >
              <label>
                İsim:
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Açıklama:
                <textarea
                  value={addForm.description}
                  onChange={(e) =>
                    setAddForm({ ...addForm, description: e.target.value })
                  }
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8, minHeight: 60 }}
                />
              </label>

              <label>
                Durum:
                <select
                  value={addForm.status}
                  onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                >
                  <option>Aktif</option>
                  <option>Beklemede</option>
                  <option>Arşiv</option>
                </select>
              </label>

              <label>
                İlerleme (%):
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={addForm.progress}
                  onChange={(e) =>
                    setAddForm({ ...addForm, progress: Number(e.target.value) })
                  }
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8, width: 110 }}
                />
              </label>

              <label>
                Başlangıç Tarihi:
                <input
                  type="date"
                  value={addForm.start_date || ""}
                  onChange={(e) =>
                    setAddForm({ ...addForm, start_date: e.target.value })
                  }
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Bitiş Tarihi:
                <input
                  type="date"
                  value={addForm.end_date || ""}
                  onChange={(e) =>
                    setAddForm({ ...addForm, end_date: e.target.value })
                  }
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  type="submit"
                  className="tasks-btn"
                  style={{ background: "#6d55e6", color: "#fff" }}
                >
                  Ekle
                </button>
                <button
                  type="button"
                  className="tasks-btn"
                  style={{ background: "#eee", color: "#333" }}
                  onClick={() => setAddOpen(false)}
                >
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
