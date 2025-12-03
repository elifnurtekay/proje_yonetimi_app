import React, { useEffect, useState } from "react";
import {
  fetchProjects,
  fetchProjectById,
  updateProject,
  deleteProject,
  addProject,
} from "../api";
import { ensureEffectiveProgress, ensureListEffectiveProgress } from "../utils/progress";
import { formatAddress, summarizeLocation } from "../utils/location";
import { geocodeAddress } from "../utils/googleMaps";
import "./Gorevler.css";
import "./Projeler.css";

const createEmptyForm = () => ({
  name: "",
  description: "",
  status: "Aktif",
  progress: 0,
  start_date: "",
  end_date: "",
  location_name: "",
  city: "",
  district: "",
  neighborhood: "",
  street: "",
  avenue: "",
  building_no: "",
  postal_code: "",
  latitude: "",
  longitude: "",
  geofence_radius: "",
});

const toInputValue = (value) =>
  value === null || typeof value === "undefined" || value === "" ? "" : String(value);

const buildAddressQuery = (payload) =>
  [
    payload.location_name,
    payload.street,
    payload.avenue,
    payload.neighborhood,
    payload.district,
    payload.city,
    payload.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

const normalizeCoordinate = (value) => {
  if (value === null || typeof value === "undefined" || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function Projeler() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyForm);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(createEmptyForm);

  const token = localStorage.getItem("access");
  const mapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const resolveCoordinates = async (payload) => {
    const query = buildAddressQuery(payload);
    if (!query || !mapsApiKey) return payload;

    try {
      const coords = await geocodeAddress(query, mapsApiKey);
      if (coords) {
        return { ...payload, latitude: coords.latitude, longitude: coords.longitude };
      }
    } catch (err) {
      console.warn("Adres geocode edilemedi:", err?.message || err);
    }

    return payload;
  };

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
      alert(e.message || "Süreç verisi alınamadı");
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
        location_name: enriched.location_name || "",
        city: enriched.city || "",
        district: enriched.district || "",
        neighborhood: enriched.neighborhood || "",
        street: enriched.street || "",
        avenue: enriched.avenue || "",
        building_no: enriched.building_no || "",
        postal_code: enriched.postal_code || "",
        latitude: toInputValue(enriched.latitude),
        longitude: toInputValue(enriched.longitude),
        geofence_radius: toInputValue(enriched.geofence_radius),
      });
      setEditOpen(true);
    } catch (e) {
      alert(e.message || "Süreç verisi alınamadı");
    }
  };

  // Düzenle kaydet
  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const base = {
        ...editForm,
        progress: Number(editForm.progress || 0),
        latitude: normalizeCoordinate(editForm.latitude),
        longitude: normalizeCoordinate(editForm.longitude),
        geofence_radius: null,
      };
      const body = await resolveCoordinates(base);
      const updated = await updateProject(editId, body, token);
      const normalized = ensureEffectiveProgress(updated, { startKey: "start_date", endKey: "end_date" }, true);
      setProjects((prev) => prev.map((p) => (p.id === normalized.id ? { ...p, ...normalized } : p)));
      setEditOpen(false);
    } catch (e) {
      alert(e.message || "Süreç güncellenemedi");
    }
  };

  // Sil
  const handleDelete = async (id) => {
    if (!window.confirm("Bu süreci silmek istediğine emin misin?")) return;
    try {
      await deleteProject(id, token);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message || "Süreç silinemedi");
    }
  };

  // Yeni Süreç -> Kaydet
  const handleAddSave = async (e) => {
    e.preventDefault();
    try {
      const base = {
        ...addForm,
        progress: Number(addForm.progress || 0),
        latitude: normalizeCoordinate(addForm.latitude),
        longitude: normalizeCoordinate(addForm.longitude),
        geofence_radius: null,
      };
      const body = await resolveCoordinates(base);
      const created = await addProject(body, token);
      const normalized = ensureEffectiveProgress(created, { startKey: "start_date", endKey: "end_date" }, true);
      setProjects((prev) => [normalized, ...prev]);
      setAddOpen(false);
      setAddForm(createEmptyForm());
    } catch (e) {
      alert(e.message || "Süreç eklenemedi");
    }
  };

  return (
    <div className="tasks-container processes-page">
      <div className="tasks-header" style={{ justifyContent: "space-between" }}>
        <h2>Süreçler</h2>

        <button
          className="tasks-btn"
          onClick={() => setAddOpen(true)}
          style={{ background: "#6d55e6", color: "#fff" }}
        >
          + Yeni Süreç
        </button>
      </div>

      {loading ? (
        <div>Yükleniyor...</div>
      ) : projects.length === 0 ? (
        <div>Gösterilecek süreç yok.</div>
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
                <br />
                <b>Lokasyon:</b> {summarizeLocation(p) || "-"}
                <br />
                <b>Adres:</b> {formatAddress(p) || "-"}
                <br />
                <b>Koordinat:</b> {p.latitude && p.longitude ? `${p.latitude}, ${p.longitude}` : "-"}
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
              <br />
              <b>Lokasyon:</b> {viewData.location_name || "-"}
              <br />
              <b>Adres:</b> {formatAddress(viewData) || "-"}
              <br />
              <b>Koordinat:</b>{" "}
              {viewData.latitude && viewData.longitude
                ? `${viewData.latitude}, ${viewData.longitude}`
                : "-"}
              <br />
              <b>Geofence:</b> {viewData.geofence_radius ? `${viewData.geofence_radius} m` : "-"}
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
            <h3 style={{ marginBottom: 12 }}>Süreci Düzenle</h3>
            <form className="process-form" onSubmit={handleEditSave}>
              <label className="process-field">
                Süreç Adı:
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </label>

              <label className="process-field">
                Açıklama:
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />
              </label>

              <div className="process-form-grid">
                <label className="process-field">
                  Durum:
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option>Aktif</option>
                    <option>Beklemede</option>
                    <option>Arşiv</option>
                  </select>
                </label>

                <label className="process-field">
                  İlerleme (%):
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.progress}
                    onChange={(e) => setEditForm({ ...editForm, progress: Number(e.target.value) })}
                  />
                </label>

                <label className="process-field">
                  Başlangıç Tarihi:
                  <input
                    type="date"
                    value={editForm.start_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  />
                </label>

                <label className="process-field">
                  Bitiş Tarihi:
                  <input
                    type="date"
                    value={editForm.end_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                  />
                </label>
              </div>

              <label className="process-field">
                Lokasyon Adı:
                <input
                  type="text"
                  value={editForm.location_name}
                  onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                />
              </label>

              <div className="process-form-grid">
                <label className="process-field">
                  Şehir:
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  İlçe:
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  Mahalle:
                  <input
                    type="text"
                    value={editForm.neighborhood}
                    onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  Sokak:
                  <input
                    type="text"
                    value={editForm.street}
                    onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  Cadde:
                  <input
                    type="text"
                    value={editForm.avenue}
                    onChange={(e) => setEditForm({ ...editForm, avenue: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  Bina No:
                  <input
                    type="text"
                    value={editForm.building_no}
                    onChange={(e) => setEditForm({ ...editForm, building_no: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  Posta Kodu:
                  <input
                    type="text"
                    value={editForm.postal_code}
                    onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                  />
                </label>
              </div>

              <div className="process-form-actions">
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

      {/* Yeni Süreç Modal */}
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
            <h3 style={{ marginBottom: 12 }}>Yeni Süreç</h3>
            <form className="process-form" onSubmit={handleAddSave}>
              <label className="process-field">
                Süreç Adı:
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </label>

              <label className="process-field">
                Açıklama:
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  rows={3}
                />
              </label>

              <div className="process-form-grid">
                <label className="process-field">
                  Durum:
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                  >
                    <option>Aktif</option>
                    <option>Beklemede</option>
                    <option>Arşiv</option>
                  </select>
                </label>

                <label className="process-field">
                  İlerleme (%):
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={addForm.progress}
                    onChange={(e) => setAddForm({ ...addForm, progress: Number(e.target.value) })}
                  />
                </label>

                <label className="process-field">
                  Başlangıç Tarihi:
                  <input
                    type="date"
                    value={addForm.start_date || ""}
                    onChange={(e) => setAddForm({ ...addForm, start_date: e.target.value })}
                  />
                </label>

                <label className="process-field">
                  Bitiş Tarihi:
                  <input
                    type="date"
                    value={addForm.end_date || ""}
                    onChange={(e) => setAddForm({ ...addForm, end_date: e.target.value })}
                  />
                </label>
              </div>

              <label className="process-field">
                Lokasyon Adı:
                <input
                  type="text"
                  value={addForm.location_name}
                  onChange={(e) => setAddForm({ ...addForm, location_name: e.target.value })}
                />
              </label>

              <div className="process-form-grid">
                <label className="process-field">
                  Şehir:
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  İlçe:
                  <input
                    type="text"
                    value={addForm.district}
                    onChange={(e) => setAddForm({ ...addForm, district: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  Mahalle:
                  <input
                    type="text"
                    value={addForm.neighborhood}
                    onChange={(e) => setAddForm({ ...addForm, neighborhood: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  Sokak:
                  <input
                    type="text"
                    value={addForm.street}
                    onChange={(e) => setAddForm({ ...addForm, street: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  Cadde:
                  <input
                    type="text"
                    value={addForm.avenue}
                    onChange={(e) => setAddForm({ ...addForm, avenue: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  Bina No:
                  <input
                    type="text"
                    value={addForm.building_no}
                    onChange={(e) => setAddForm({ ...addForm, building_no: e.target.value })}
                  />
                </label>
                <label className="process-field">
                  Posta Kodu:
                  <input
                    type="text"
                    value={addForm.postal_code}
                    onChange={(e) => setAddForm({ ...addForm, postal_code: e.target.value })}
                  />
                </label>
              </div>

              <div className="process-form-actions" style={{ marginTop: 12 }}>
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