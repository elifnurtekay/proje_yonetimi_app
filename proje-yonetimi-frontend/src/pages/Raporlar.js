import React, { useEffect, useMemo, useState } from "react";
import { fetchReportsSummary } from "../api";

export default function Raporlar() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access");

  useEffect(() => {
    setLoading(true);
    fetchReportsSummary(token)
      .then(setData)
      .catch((e) => alert(e.message || "Rapor verisi alınamadı"))
      .finally(() => setLoading(false));
  }, [token]);

  const totals = useMemo(() => {
    const s = data?.status_counts || {};
    const total = (s["Tamamlandı"] || 0) + (s["Devam Ediyor"] || 0) + (s["Beklemede"] || 0);
    return { ...s, total };
  }, [data]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Raporlar</h2>

      {loading ? (
        <div>Yükleniyor...</div>
      ) : !data ? (
        <div>Veri bulunamadı.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
            marginTop: 16,
          }}
        >
          {/* Görev Durumu Kartı */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 2px 12px #2e2e440d",
              padding: 20,
            }}
          >
            <h3 style={{ marginBottom: 14 }}>Görev Durumu</h3>

            {[
              { key: "Tamamlandı", color: "#16a34a" },
              { key: "Devam Ediyor", color: "#3b82f6" },
              { key: "Beklemede", color: "#f59e0b" },
            ].map((row) => {
              const count = data.status_counts[row.key] || 0;
              const width =
                totals.total > 0 ? Math.round((count / totals.total) * 100) : 0;
              return (
                <div
                  key={row.key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 1fr 80px",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div>{row.key}</div>
                  <div
                    style={{
                      background: "#eef1f8",
                      borderRadius: 999,
                      height: 8,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${width}%`,
                        height: 8,
                        background: row.color,
                        borderRadius: 999,
                        transition: "width .3s",
                      }}
                    />
                  </div>
                  <div style={{ color: "#6b7280" }}>{count} görev</div>
                </div>
              );
            })}
          </div>

          {/* Kullanıcı Performansı Kartı */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 2px 12px #2e2e440d",
              padding: 20,
            }}
          >
            <h3 style={{ marginBottom: 14 }}>Kullanıcı Performansı</h3>

            {data.users?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.users.slice(0, 10).map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "24px 1fr 60px 200px",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div>👤</div>
                    <div style={{ fontWeight: 600 }}>{u.name || "—"}</div>
                    <div style={{ color: "#6d28d9", fontWeight: 700 }}>
                      %{u.rate}
                    </div>
                    <div style={{ color: "#6b7280" }}>
                      {u.total || 0} görev tamamlama oranı
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#6b7280" }}>Kullanıcı verisi yok.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
