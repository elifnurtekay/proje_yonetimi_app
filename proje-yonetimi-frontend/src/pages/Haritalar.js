import React, { useEffect, useMemo, useState } from "react";
import GoogleProcessMap from "../components/GoogleProcessMap";
import { fetchProjects } from "../api";
import { ensureListEffectiveProgress } from "../utils/progress";
import { summarizeLocation } from "../utils/location";
import "./Gorevler.css";
import "./Projeler.css";

export default function Haritalar() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access");

  useEffect(() => {
    setLoading(true);
    fetchProjects(token)
      .then((data) => ensureListEffectiveProgress(data, { startKey: "start_date", endKey: "end_date" }))
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [token]);

  const processesWithCoords = useMemo(
    () => projects.filter((p) => p.latitude && p.longitude),
    [projects]
  );

  return (
    <div className="tasks-container processes-page">
      <div className="tasks-header" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>Haritalar</h2>
          <p style={{ color: "#5b6475", marginTop: 4 }}>
            Süreçlerinizin saha durumunu Google Haritalar üzerinde canlı olarak izleyin.
          </p>
        </div>
      </div>

      <div className="processes-map-wrapper">
        <div className="processes-map-header" style={{ alignItems: "flex-start" }}>
          <div>
            <h3>Google Harita Görünümü</h3>
            <p>
              Koordinatı bulunan süreçler harita üzerinde kartlar halinde gösterilir. Kartlar, sürecin adı, durumu ve
              detaylı adres bilgisi ile sahada hızlı durum değerlendirmesi sağlar.
            </p>
          </div>
          <div className="map-legend">
            <div className="legend-dot" />
            <div>
              <strong>Kartlar</strong>
              <div>Her süreç için mor tonlu bilgi kartı</div>
            </div>
          </div>
        </div>

        {processesWithCoords.length > 0 ? (
          <GoogleProcessMap processes={processesWithCoords} />
        ) : (
          <div className="processes-empty-map">
            {loading ? "Harita yükleniyor..." : "Koordinat bilgisi girilmiş bir süreç bulunamadı."}
            <div style={{ marginTop: 6, color: "#6b7280" }}>
              Süreç oluştururken şehir, ilçe, mahalle, sokak ve cadde bilgilerini tamamlayın ve koordinatı ekleyerek
              haritada görünmesini sağlayın.
            </div>
          </div>
        )}
      </div>

      <div className="processes-grid">
        {(loading ? Array.from({ length: 3 }) : projects).map((project, idx) => (
          <div key={project?.id || idx} className="task-card" style={{ opacity: loading ? 0.5 : 1 }}>
            <div className="task-card-header">
              <span className="task-title">{project?.name || "Yükleniyor"}</span>
              <span className="task-priority düşük">{project?.status || "-"}</span>
            </div>
            <div className="task-desc">{project?.description || "-"}</div>
            <div className="task-info">
              <b>Lokasyon:</b> {project ? summarizeLocation(project) || "-" : "-"}
              <br />
              <b>Koordinat:</b>
              {project && project.latitude && project.longitude
                ? ` ${project.latitude}, ${project.longitude}`
                : " -"}
              <br />
              <b>İlerleme:</b> %{project?.effective_progress ?? project?.progress ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
