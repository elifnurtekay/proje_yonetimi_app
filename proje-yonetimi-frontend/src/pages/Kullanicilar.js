// src/pages/Kullanicilar.js
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchUsers,
  fetchMe,
  updateUser,
} from "../api";
import "./Kullanicilar.css";

export default function Kullanicilar() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",         // varsa backend’de role alanı
    is_staff: false,  // sadece görüntü amaçlı; admin mi değil mi
  });

  const token = localStorage.getItem("access");

  const isAdmin = useMemo(() => !!me?.is_staff || me?.role === "Admin", [me]);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        const [meData, usersData] = await Promise.all([
          fetchMe(token),
          fetchUsers(token),
        ]);
        setMe(meData);
        setUsers(usersData);
      } catch (e) {
        alert(e.message || "Kullanıcılar alınamadı");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [token]);

  // Düzenle modalını aç
  const openEdit = (u) => {
    setEditUserId(u.id);
    setForm({
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      email: u.email || "",
      role: u.role ?? (u.is_staff ? "Admin" : "Ekip Üyesi"),
      is_staff: !!u.is_staff,
    });
    setEditOpen(true);
  };

  // Sadece admin ise role değişikliği gönderilecek
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        // email değişikliğine izin vermek istiyorsan aç:
        // email: form.email,
      };

      // Rol yönetimi: Eğer projende 'role' alanı varsa backend onu bekliyor.
      // Yoksa sadece backend is_staff üzerinden yönetiyordur; o zaman role göndermeyin.
      if (isAdmin && 'role' in form) {
        payload.role = form.role; // serializer, admin değilse zaten yok sayacak.
      }

      const updated = await updateUser(editUserId, payload, token);

      // listede güncelle
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));

      // Eğer kendini güncellediyse me’yi de tazele
      if (me?.id === updated.id) setMe((m) => ({ ...m, ...updated }));

      setEditOpen(false);
    } catch (e) {
      alert(e.message || "Kullanıcı güncellenemedi");
    }
  };

  return (
    <div className="kullanicilar-container">
      <h2>Kullanıcılar</h2>

      {/* yeni kullanıcı ekleme sistemin ayrı endpoint ileyse burada modal vs. ekleyebilirsin
          Ama silme yok! */}

      {loading ? (
        <div>Yükleniyor...</div>
      ) : (
        <table className="kullanici-table">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>E-Posta</th>
              <th>Rol</th>
              <th>Görevler</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const roleText = u.role ?? (u.is_staff ? "Admin" : "Ekip Üyesi");
              const canEdit = isAdmin || me?.id === u.id; // admin herkes; normal kullanıcı sadece kendini

              return (
                <tr key={u.id}>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`kullanici-rol ${roleText === "Admin" ? "admin" : "uye"}`}>
                      {roleText}
                    </span>
                  </td>
                  <td>{u.task_count != null ? `${u.task_count} görev` : "-"}</td>
                  <td>
                    {canEdit && (
                      <button
                        className="kullanici-edit-btn"
                        onClick={() => openEdit(u)}
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                    )}
                    {/* SİL BUTONU YOK */}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
            <h3 style={{ marginBottom: 12 }}>Kullanıcıyı Düzenle</h3>
            <form
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
              onSubmit={handleSave}
            >
              <label>
                Ad:
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                Soyad:
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              <label>
                E-posta:
                <input
                  type="email"
                  value={form.email}
                  disabled   // mail değişikliği açmak istersen disabled'ı kaldır
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                />
              </label>

              {/* ROL — yalnızca admin değiştirebilir */}
              <label>
                Rol:
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  disabled={!isAdmin}
                  style={{ padding: 8, borderRadius: 6, marginLeft: 8 }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Ekip Üyesi">Ekip Üyesi</option>
                </select>
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
    </div>
  );
}
