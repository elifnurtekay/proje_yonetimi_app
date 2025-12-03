// src/components/ProcessMap.js
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

export default function ProcessMap({ processes = [] }) {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]); // { marker, circle } çiftlerini tut

  // 1) Haritayı 1 kez kur
  useEffect(() => {
    if (mapRef.current || !mapNode.current) return;

    // İlk geçerli process varsa onun koordinatını merkez al
    const first = Array.isArray(processes)
      ? processes.find((p) => p?.latitude && p?.longitude)
      : null;
    const center = first
      ? [Number(first.latitude), Number(first.longitude)]
      : DEFAULT_CENTER;

    const map = L.map(mapNode.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
    }).setView(center, DEFAULT_ZOOM);

    L.tileLayer(TILE_LAYER, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 18,
    }).addTo(map);

    L.control
      .zoom({
        position: "topright",
      })
      .addTo(map);

    // container’ın boyut hesabını düzelt
    setTimeout(() => map.invalidateSize(), 150);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Marker & geofence katmanlarını processes değiştikçe güncelle
  useEffect(() => {
    if (!mapRef.current) return;

    // Eski katmanları kaldır
    layersRef.current.forEach(({ marker, circle }) => {
      if (marker) mapRef.current.removeLayer(marker);
      if (circle) mapRef.current.removeLayer(circle);
    });
    layersRef.current = [];

    const bounds = L.latLngBounds([]);

    (processes || []).forEach((process) => {
      const {
        latitude,
        longitude,
        name,
        location_name,
        effective_progress,
        progress,
        status,
        geofence_radius,
      } = process || {};

      if (latitude == null || longitude == null || latitude === "" || longitude === "")
        return;

      const lat = Number(latitude);
      const lng = Number(longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const finalProgress = Math.min(
        100,
        Math.max(0, Number(effective_progress ?? progress ?? 0))
      );
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
      const r = Number(geofence_radius || 0);
      if (!Number.isNaN(r) && r > 0) {
        circle = L.circle([lat, lng], {
          radius: r,
          color: "#4c6ef5",
          weight: 2,
          fillOpacity: 0.08,
          dashArray: "4 6",
        }).addTo(mapRef.current);
      }

      layersRef.current.push({ marker, circle });
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
  }, [processes]);

  return <div className="process-map" ref={mapNode} role="presentation" />;
}
