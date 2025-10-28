import React, { useEffect, useRef } from "react";
import "./ProcessMap.css";

const DEFAULT_CENTER = [39.925533, 32.866287];
const DEFAULT_ZOOM = 13;
const TILE_LAYER =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIBUTION =
  'Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community';

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ensureLeafletAssets() {
  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (window.__leafletLoading) {
    return window.__leafletLoading;
  }

  window.__leafletLoading = new Promise((resolve, reject) => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha512-sA+e2atTH0uShuR+gG2CjGPhumZbKOEJT9ylh7DiIP9N6obrN1Ns26E40sp1Ian2nKx4um5gkWXBJMy3wPItPw==";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-js";
    if (document.getElementById(scriptId)) {
      const existing = document.getElementById(scriptId);
      if (existing.dataset.loaded === "true") {
        resolve(window.L);
        return;
      }
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha512-vQ8cW1GMBT9Q4GNzcRCjSc5MiNmiY6LHlH944sW1YHlzTH0jzZMfjNV8iP9FeZVt8zl0JdLwMV07R7B5iZPnwQ==";
    script.crossOrigin = "";
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve(window.L);
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });

  return window.__leafletLoading;
}

export default function ProcessMap({ processes }) {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef([]);
  const leafletRef = useRef(null);

  useEffect(() => {
    let disposed = false;

    ensureLeafletAssets()
      .then((L) => {
        if (disposed || !mapNode.current) {
          return;
        }

        leafletRef.current = L;

        if (!mapRef.current) {
          const hasValidProcess = Array.isArray(processes)
            ? processes.find((p) => p.latitude && p.longitude)
            : null;
          const center = hasValidProcess
            ? [Number(hasValidProcess.latitude), Number(hasValidProcess.longitude)]
            : DEFAULT_CENTER;

          mapRef.current = L.map(mapNode.current, {
            zoomControl: false,
            attributionControl: false,
            minZoom: 3,
          }).setView(center, DEFAULT_ZOOM);

          L.tileLayer(TILE_LAYER, {
            attribution: TILE_ATTRIBUTION,
            maxZoom: 18,
          }).addTo(mapRef.current);

          L.control
            .zoom({
              position: "topright",
            })
            .addTo(mapRef.current);

          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
            }
          }, 150);
        }

        updateMarkers(L);
      })
      .catch((err) => {
        console.error("Leaflet yüklenemedi", err);
      });

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const update = (L) => {
      leafletRef.current = L;
      updateMarkers(L);
    };

    if (leafletRef.current) {
      update(leafletRef.current);
    } else {
      ensureLeafletAssets().then(update).catch((err) => console.error(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processes]);

  const updateMarkers = (L) => {
    if (!mapRef.current) {
      return;
    }

    markerRef.current.forEach(({ marker, circle }) => {
      if (marker) {
        mapRef.current.removeLayer(marker);
      }
      if (circle) {
        mapRef.current.removeLayer(circle);
      }
    });
    markerRef.current = [];

    const bounds = L.latLngBounds([]);

    (processes || []).forEach((process) => {
      const { latitude, longitude, name, location_name, effective_progress, progress, status, geofence_radius } = process;
      if (latitude == null || longitude == null || latitude === "" || longitude === "") {
        return;
      }

      const lat = Number(latitude);
      const lng = Number(longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
      }

      const finalProgress = Math.min(100, Math.max(0, Number(effective_progress ?? progress ?? 0)));
      const safeName = escapeHtml(name || "Süreç");
      const safeLocation = escapeHtml(location_name || "Lokasyon Bilgisi Yok");
      const statusLabel = escapeHtml(status || "Aktif");

      const badgeHtml = `
        <div class="process-map-badge">
          <div class="process-map-badge-title">${safeName}</div>
          <div class="process-map-badge-location">${safeLocation}</div>
          <div class="process-map-badge-status">${statusLabel} • %${finalProgress}</div>
          <div class="process-map-badge-progress">
            <div class="process-map-badge-progress-fill" style="width:${finalProgress}%"></div>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: badgeHtml,
          className: "process-map-icon",
          iconSize: [220, 110],
          iconAnchor: [110, 90],
        }),
      }).addTo(mapRef.current);

      let circle = null;
      if (geofence_radius) {
        const radius = Number(geofence_radius);
        if (!Number.isNaN(radius) && radius > 0) {
          circle = L.circle([lat, lng], {
            radius,
            color: "#4c6ef5",
            weight: 2,
            fillOpacity: 0.08,
            dashArray: "4 6",
          }).addTo(mapRef.current);
        }
      }

      markerRef.current.push({ marker, circle });
      bounds.extend([lat, lng]);
    });

    if (!bounds.isValid()) {
      mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      mapRef.current.setView(bounds.getCenter(), 15);
    } else {
      mapRef.current.fitBounds(bounds, { padding: [60, 60] });
    }
  };

  return <div className="process-map" ref={mapNode} role="presentation" />;
}
